import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  insertAdminRegistrationSchema,
  insertBlacklistSchema,
  insertEventSchema,
  insertRegistrationSchema,
  insertTimeSlotSchema,
  insertWaitlistSchema,
} from "@shared/schema";
import { formatEmailDate, formatEmailTime } from "@shared/timezone";
import { storage } from "@server/storage";
import { generateAuthToken, verifyAuthToken, verifyPassword } from "@server/lib/auth";
import {
  sendCancellationNotification,
  sendNewRegistrationNotification,
  sendWaitlistNotification,
} from "@server/lib/admin-notifications";
import {
  sendConfirmationEmail,
  sendWaitlistConfirmationEmail,
} from "@server/lib/sendgrid";
import { getAppUrl } from "@server/lib/app-url";
import {
  processRecurringEventCron,
  processReminderCron,
} from "@server/lib/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    path: string[];
  };
};

function json(message: string, status = 500, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

function noContent() {
  return new NextResponse(null, { status: 204 });
}

async function readBody<T = Record<string, unknown>>(request: NextRequest): Promise<T> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return {} as T;
  }

  return request.json();
}

function getAuthorizationToken(request: NextRequest) {
  return request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || null;
}

function requireAdmin(request: NextRequest) {
  const token = getAuthorizationToken(request);
  if (!token) {
    return { error: json("Authentication token required", 401) };
  }

  const adminId = verifyAuthToken(token);
  if (!adminId) {
    return { error: json("Invalid or expired token", 401) };
  }

  return { adminId };
}

function requireCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return { error: json("CRON_SECRET is not configured", 500) };
  }

  if (getAuthorizationToken(request) !== secret) {
    return { error: json("Unauthorized cron request", 401) };
  }

  return { ok: true };
}

function getEventLocation(event: Awaited<ReturnType<typeof storage.getEvent>>) {
  if (!event) {
    return "";
  }

  return event.laundromatName
    ? `${event.laundromatName}${event.laundromatAddress ? `, ${event.laundromatAddress}` : ""}`
    : event.location;
}

function buildCancelUrl(token: string) {
  return `${getAppUrl()}/cancel/${token}`;
}

async function sendRegistrationEmails(params: {
  registration: Awaited<ReturnType<typeof storage.createRegistration>>;
  eventId: string;
  timeSlotId: string;
  status: "confirmed" | "waitlist";
}) {
  const event = await storage.getEvent(params.eventId);
  const timeSlots = await storage.getTimeSlotsByEvent(params.eventId);
  const targetSlot = timeSlots.find((slot) => slot.id === params.timeSlotId);

  if (!event || !targetSlot) {
    return;
  }

  const emailArgs = {
    name: params.registration.name,
    email: params.registration.email,
    eventTitle: event.title,
    eventDate: formatEmailDate(targetSlot.startTime),
    eventTime: `${formatEmailTime(targetSlot.startTime)} - ${formatEmailTime(targetSlot.endTime)}`,
    eventLocation: getEventLocation(event),
    cancelUrl: buildCancelUrl(params.registration.uniqueCancelToken),
  };

  if (params.status === "confirmed") {
    await sendConfirmationEmail({
      ...emailArgs,
      startTime: targetSlot.startTime,
      endTime: targetSlot.endTime,
    });
    await sendNewRegistrationNotification({
      registration: params.registration,
      event,
      timeSlot: targetSlot,
    });
    return;
  }

  await sendWaitlistConfirmationEmail(emailArgs);
  await sendWaitlistNotification({
    registration: params.registration,
    event,
    timeSlot: targetSlot,
  });
}

async function createRegistration(body: unknown, isAdmin = false) {
  const validatedData = isAdmin
    ? insertAdminRegistrationSchema.parse(body)
    : insertRegistrationSchema.parse(body);

  if (
    !isAdmin &&
    validatedData.name &&
    validatedData.email &&
    validatedData.phone &&
    (await storage.checkBlacklist(
      validatedData.name,
      validatedData.email,
      validatedData.phone,
    ))
  ) {
    return {
      error: json(
        "Unable to register. Please contact Christ's Loving Hands at 513-367-7746",
        403,
      ),
    };
  }

  const isDuplicate = await storage.checkDuplicateRegistration(
    validatedData.email,
    validatedData.phone || "",
    validatedData.eventId,
  );

  if (isDuplicate) {
    return {
      error: json(
        isAdmin
          ? "This person is already registered for this event"
          : "You are already registered for this event",
        400,
      ),
    };
  }

  const timeSlots = await storage.getTimeSlotsByEvent(validatedData.eventId);
  const targetSlot = timeSlots.find((slot) => slot.id === validatedData.timeSlotId);
  if (!targetSlot) {
    return { error: json("Time slot not found", 404) };
  }

  let status: "confirmed" | "waitlist" = "confirmed";
  if (isAdmin && "status" in validatedData && validatedData.status) {
    if (!["confirmed", "waitlist"].includes(validatedData.status)) {
      return { error: json("Invalid status. Must be 'confirmed' or 'waitlist'", 400) };
    }
    status = validatedData.status as "confirmed" | "waitlist";
  } else {
    const registrations = await storage.getRegistrationsByEvent(validatedData.eventId);
    const confirmedCount = registrations.filter(
      (registration) =>
        registration.timeSlot.id === validatedData.timeSlotId &&
        registration.status === "confirmed",
    ).length;

    status = confirmedCount >= targetSlot.capacity ? "waitlist" : "confirmed";
  }

  const registration = await storage.createRegistration({
    ...validatedData,
    status,
  });

  try {
    await sendRegistrationEmails({
      registration,
      eventId: validatedData.eventId,
      timeSlotId: validatedData.timeSlotId,
      status,
    });
  } catch (error) {
    console.error("Error sending registration email:", error);
  }

  return { registration, status };
}

async function createWaitlistRegistration(body: unknown) {
  const validatedData = insertWaitlistSchema.parse(body);
  const isDuplicate = await storage.checkDuplicateRegistration(
    validatedData.email,
    "",
    validatedData.eventId,
  );

  if (isDuplicate) {
    return { error: json("You are already registered for this event", 400) };
  }

  const registration = await storage.createRegistration({
    ...validatedData,
    status: "waitlist",
    zipCode: "",
  });

  try {
    await sendRegistrationEmails({
      registration,
      eventId: validatedData.eventId,
      timeSlotId: validatedData.timeSlotId,
      status: "waitlist",
    });
  } catch (error) {
    console.error("Error sending waitlist confirmation email:", error);
  }

  return { registration };
}

async function handleCancelByToken(token: string) {
  const registration = await storage.getRegistrationByToken(token);
  if (!registration) {
    return json("Registration not found", 404);
  }

  if (registration.status === "cancelled") {
    return json("Registration already cancelled", 400);
  }

  const wasConfirmed = registration.status === "confirmed";
  await storage.cancelRegistration(token);

  try {
    const event = await storage.getEvent(registration.eventId);
    const timeSlots = await storage.getTimeSlotsByEvent(registration.eventId);
    const timeSlot = timeSlots.find((slot) => slot.id === registration.timeSlotId);
    if (event && timeSlot) {
      await sendCancellationNotification({ registration, event, timeSlot });
    }
  } catch (error) {
    console.error("Error sending cancellation notification:", error);
  }

  if (wasConfirmed) {
    await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
  }

  return NextResponse.json({ message: "Registration cancelled successfully" });
}

async function handleAdminLogin(request: NextRequest) {
  const body = await readBody<{ username?: string; password?: string }>(request);
  if (!body.username || !body.password) {
    return json("Username and password required", 400);
  }

  const admin = await storage.getAdminByUsername(body.username);
  if (!admin) {
    return json("Invalid credentials", 401);
  }

  const isValidPassword = await verifyPassword(body.password, admin.passwordHash);
  if (!isValidPassword) {
    return json("Invalid credentials", 401);
  }

  return NextResponse.json({
    token: generateAuthToken(admin.id),
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
    },
  });
}

async function handleCreateEvent(request: NextRequest) {
  const body = await readBody<Record<string, unknown>>(request);
  const { timeSlots: timeSlotsData, ...eventData } = body;

  const validatedEventData = insertEventSchema.parse({
    ...eventData,
    date: new Date(String(eventData.date)),
  });

  const event = await storage.createEvent(validatedEventData);

  if (Array.isArray(timeSlotsData)) {
    for (const slotData of timeSlotsData) {
      const slot = slotData as Record<string, unknown>;
      const validatedSlotData = insertTimeSlotSchema.parse({
        ...slot,
        eventId: event.id,
        startTime: new Date(String(slot.startTime)),
        endTime: new Date(String(slot.endTime)),
      });
      await storage.createTimeSlot(validatedSlotData);
    }
  }

  return NextResponse.json(event, { status: 201 });
}

async function handleUpdateEvent(request: NextRequest, id: string) {
  const body = await readBody<Record<string, unknown>>(request);
  const { timeSlots: timeSlotsData, ...eventData } = body;

  const validatedEventData = insertEventSchema.partial().parse({
    ...eventData,
    date: eventData.date ? new Date(String(eventData.date)) : undefined,
  });

  const event = await storage.updateEvent(id, validatedEventData);

  if (Array.isArray(timeSlotsData)) {
    const existingSlots = await storage.getTimeSlotsByEvent(id);

    for (const existingSlot of existingSlots) {
      const stillExists = timeSlotsData.find(
        (newSlot) => (newSlot as Record<string, unknown>).id === existingSlot.id,
      );
      if (!stillExists) {
        const registrations = await storage.getRegistrationsByEvent(id);
        const hasRegistrations = registrations.some(
          (registration) => registration.timeSlot.id === existingSlot.id,
        );
        if (!hasRegistrations) {
          await storage.deleteTimeSlot(existingSlot.id);
        }
      }
    }

    for (const rawSlot of timeSlotsData) {
      const slotData = rawSlot as Record<string, unknown>;
      if (slotData.id) {
        const validatedSlotData = insertTimeSlotSchema.partial().parse({
          startTime: new Date(String(slotData.startTime)),
          endTime: new Date(String(slotData.endTime)),
          capacity: slotData.capacity,
        });
        await storage.updateTimeSlot(String(slotData.id), validatedSlotData);
      } else {
        const validatedSlotData = insertTimeSlotSchema.parse({
          ...slotData,
          eventId: event.id,
          startTime: new Date(String(slotData.startTime)),
          endTime: new Date(String(slotData.endTime)),
        });
        await storage.createTimeSlot(validatedSlotData);
      }
    }
  }

  return NextResponse.json(event);
}

async function handleCloneEvent(request: NextRequest, id: string) {
  const body = await readBody<{ date?: string }>(request);
  if (!body.date) {
    return json("New date is required", 400);
  }

  const originalEvent = await storage.getEvent(id);
  if (!originalEvent) {
    return json("Event not found", 404);
  }

  const timeSlots = await storage.getTimeSlotsByEvent(id);
  const [year, month, day] = body.date.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);

  const newEvent = await storage.createEvent({
    title: originalEvent.title,
    description: originalEvent.description,
    date: eventDate,
    location: originalEvent.location,
    laundromatName: originalEvent.laundromatName,
    laundromatAddress: originalEvent.laundromatAddress,
  });

  for (const slot of timeSlots) {
    const originalStart = new Date(slot.startTime);
    const originalEnd = new Date(slot.endTime);
    await storage.createTimeSlot({
      eventId: newEvent.id,
      startTime: new Date(
        year,
        month - 1,
        day,
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        originalStart.getMilliseconds(),
      ),
      endTime: new Date(
        year,
        month - 1,
        day,
        originalEnd.getHours(),
        originalEnd.getMinutes(),
        originalEnd.getSeconds(),
        originalEnd.getMilliseconds(),
      ),
      capacity: slot.capacity,
    });
  }

  return NextResponse.json(newEvent, { status: 201 });
}

async function handleUpdateRegistration(request: NextRequest, id: string) {
  const body = await readBody(request);
  const registrationData = insertRegistrationSchema.partial().parse(body);
  const originalRegistration = await storage.getRegistrationById(id);
  if (!originalRegistration) {
    return json("Registration not found", 404);
  }

  const wasConfirmed = originalRegistration.status === "confirmed";
  const becomingNonConfirmed =
    !!registrationData.status &&
    ["cancelled", "no-show"].includes(registrationData.status);

  const registration = await storage.updateRegistration(id, registrationData);

  if (wasConfirmed && becomingNonConfirmed) {
    await storage.notifyWaitlist(
      originalRegistration.eventId,
      originalRegistration.timeSlotId,
    );
  }

  return NextResponse.json(registration);
}

async function handleCancelRegistration(id: string) {
  const registration = await storage.getRegistrationById(id);
  if (!registration) {
    return json("Registration not found", 404);
  }

  const wasConfirmed = registration.status === "confirmed";
  await storage.updateRegistrationStatus(id, "cancelled");

  try {
    await sendCancellationNotification({
      registration,
      event: registration.event,
      timeSlot: registration.timeSlot,
    });
  } catch (error) {
    console.error("Error sending admin cancellation notification:", error);
  }

  if (wasConfirmed) {
    await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
  }

  return noContent();
}

async function handleNoShow(id: string) {
  const registration = await storage.getRegistrationById(id);
  if (!registration) {
    return json("Registration not found", 404);
  }

  const wasConfirmed = registration.status === "confirmed";
  await storage.updateRegistration(id, { status: "no-show" });
  await storage.addToBlacklist({
    name: registration.name,
    email: registration.email,
    phone: registration.phone || "",
    reason: `No-show for event on ${new Date(registration.timeSlot.startTime).toLocaleDateString()}`,
  });

  if (wasConfirmed) {
    await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
  }

  return NextResponse.json({
    message: "Registration marked as no-show and added to blacklist",
  });
}

async function handleDeleteRegistration(id: string) {
  const registration = await storage.getRegistrationById(id);
  if (!registration) {
    return json("Registration not found", 404);
  }

  const wasConfirmed = registration.status === "confirmed";
  await storage.deleteRegistration(id);

  try {
    await sendCancellationNotification({
      registration: { ...registration, status: "cancelled" },
      event: registration.event,
      timeSlot: registration.timeSlot,
    });
  } catch (error) {
    console.error("Error sending deletion notification:", error);
  }

  if (wasConfirmed) {
    await storage.notifyWaitlist(registration.eventId, registration.timeSlotId);
  }

  return noContent();
}

async function handleCsvExport(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("eventId");
  if (!eventId) {
    return json("Event ID is required", 400);
  }

  const registrations = await storage.getRegistrationsByEvent(eventId);
  const headers = "Name,Email,Phone,Status,Time Slot,Registration Date\n";
  const rows = registrations
    .map(
      (registration) =>
        `"${registration.name}","${registration.email}","${registration.phone}","${registration.status}","${registration.timeSlot.startTime.toLocaleString()}","${registration.createdAt.toLocaleString()}"`,
    )
    .join("\n");

  return new NextResponse(headers + rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=registrations.csv",
    },
  });
}

async function handleRequest(request: NextRequest, context: RouteContext) {
  const path = context.params.path;
  const pathKey = path.join("/");

  try {
    if (request.method === "GET" && pathKey === "events") {
      return NextResponse.json(await storage.getActiveEvents());
    }

    if (request.method === "GET" && path[0] === "events" && path[1]) {
      const event = await storage.getEvent(path[1]);
      return event ? NextResponse.json(event) : json("Event not found", 404);
    }

    if (request.method === "POST" && pathKey === "register") {
      const result = await createRegistration(await readBody(request), false);
      if ("error" in result) {
        return result.error;
      }

      return NextResponse.json(
        {
          registration: result.registration,
          status: result.status,
          message:
            result.status === "waitlist"
              ? "You've been added to the waitlist. We'll notify you if a spot opens up."
              : "Registration confirmed! Check your email for details.",
        },
        { status: 201 },
      );
    }

    if (request.method === "POST" && pathKey === "waitlist") {
      const result = await createWaitlistRegistration(await readBody(request));
      if ("error" in result) {
        return result.error;
      }

      return NextResponse.json(
        {
          registration: result.registration,
          message: "Added to waitlist - you will be notified if a spot opens",
        },
        { status: 201 },
      );
    }

    if (request.method === "POST" && path[0] === "cancel" && path[1]) {
      return handleCancelByToken(path[1]);
    }

    if (request.method === "POST" && pathKey === "admin/login") {
      return handleAdminLogin(request);
    }

    if (path[0] === "cron") {
      const cron = requireCron(request);
      if ("error" in cron) {
        return cron.error;
      }

      if (["GET", "POST"].includes(request.method) && pathKey === "cron/reminders") {
        return NextResponse.json(await processReminderCron());
      }

      if (
        ["GET", "POST"].includes(request.method) &&
        pathKey === "cron/recurring-events"
      ) {
        return NextResponse.json(await processRecurringEventCron());
      }
    }

    if (path[0] !== "admin") {
      return json("Not found", 404);
    }

    const admin = requireAdmin(request);
    if ("error" in admin) {
      return admin.error;
    }

    if (request.method === "GET" && pathKey === "admin/events") {
      return NextResponse.json(await storage.getAllEvents());
    }

    if (request.method === "POST" && pathKey === "admin/events") {
      return handleCreateEvent(request);
    }

    if (request.method === "PUT" && path[1] === "events" && path[2]) {
      return handleUpdateEvent(request, path[2]);
    }

    if (request.method === "DELETE" && path[1] === "events" && path[2]) {
      await storage.deleteEvent(path[2]);
      return noContent();
    }

    if (
      request.method === "POST" &&
      path[1] === "events" &&
      path[2] &&
      path[3] === "clone"
    ) {
      return handleCloneEvent(request, path[2]);
    }

    if (request.method === "GET" && pathKey === "admin/registrations") {
      const eventId = request.nextUrl.searchParams.get("eventId");
      const status = request.nextUrl.searchParams.get("status");
      if (!eventId) {
        return json("Event ID is required", 400);
      }

      const registrations = await storage.getRegistrationsByEvent(eventId);
      return NextResponse.json(
        status
          ? registrations.filter((registration) => registration.status === status)
          : registrations,
      );
    }

    if (request.method === "GET" && path[1] === "registrations" && path[2]) {
      const status = request.nextUrl.searchParams.get("status");
      const registrations = await storage.getRegistrationsByEvent(path[2]);
      return NextResponse.json(
        status
          ? registrations.filter((registration) => registration.status === status)
          : registrations,
      );
    }

    if (request.method === "POST" && pathKey === "admin/registrations") {
      const result = await createRegistration(await readBody(request), true);
      if ("error" in result) {
        return result.error;
      }

      return NextResponse.json(
        {
          registration: result.registration,
          status: result.status,
          message:
            result.status === "waitlist"
              ? "Registration added to waitlist"
              : "Registration created successfully",
        },
        { status: 201 },
      );
    }

    if (request.method === "PUT" && path[1] === "registrations" && path[2] && !path[3]) {
      return handleUpdateRegistration(request, path[2]);
    }

    if (
      request.method === "PUT" &&
      path[1] === "registrations" &&
      path[2] &&
      path[3] === "cancel"
    ) {
      return handleCancelRegistration(path[2]);
    }

    if (
      request.method === "POST" &&
      path[1] === "registrations" &&
      path[2] &&
      path[3] === "no-show"
    ) {
      return handleNoShow(path[2]);
    }

    if (
      request.method === "DELETE" &&
      path[1] === "registrations" &&
      path[2] &&
      !path[3]
    ) {
      return handleDeleteRegistration(path[2]);
    }

    if (request.method === "POST" && pathKey === "admin/blacklist") {
      const blacklistData = insertBlacklistSchema.parse(await readBody(request));
      return NextResponse.json(await storage.addToBlacklist(blacklistData), {
        status: 201,
      });
    }

    if (request.method === "GET" && pathKey === "admin/blacklist") {
      return NextResponse.json(await storage.getBlacklist());
    }

    if (request.method === "DELETE" && path[1] === "blacklist" && path[2]) {
      await storage.removeFromBlacklist(path[2]);
      return noContent();
    }

    if (request.method === "GET" && pathKey === "admin/stats") {
      return NextResponse.json(await storage.getEventStats());
    }

    if (request.method === "GET" && pathKey === "admin/recent-activity") {
      return NextResponse.json(await storage.getRecentActivity());
    }

    if (request.method === "GET" && pathKey === "admin/export/csv") {
      return handleCsvExport(request);
    }

    return json("Not found", 404);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request data",
          errors: error.errors,
        },
        { status: 400 },
      );
    }

    console.error("API route error:", error);
    return json("Internal Server Error", 500);
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleRequest(request, context);
}
