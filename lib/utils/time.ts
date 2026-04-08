import type { MeetingTime, StudentConstraintBlock } from "@/lib/types";

const dayAliases: Record<string, string[]> = {
  M: ["M"],
  T: ["T"],
  W: ["W"],
  R: ["R"],
  F: ["F"],
  S: ["S"],
  U: ["U"],
  MW: ["M", "W"],
  TR: ["T", "R"],
  TTH: ["T", "R"],
  MWF: ["M", "W", "F"]
};

export function parseClockTime(value: string): number | undefined {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);
  if (!match) {
    return undefined;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  if (match[3].toUpperCase() === "PM") {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export function parseMeetingText(input: string): MeetingTime[] {
  const clean = input.replace(/\s+/g, " ").trim();
  const match = clean.match(/([A-Z\-]+)\s+(\d{1,2}:\d{2}[AP]M)\s*-\s*(\d{1,2}:\d{2}[AP]M)/i);

  if (!match) {
    return [];
  }

  const days = dayAliases[match[1].toUpperCase()] ?? match[1].toUpperCase().split("").filter((day) => day !== "-");
  const startMinutes = parseClockTime(match[2]);
  const endMinutes = parseClockTime(match[3]);

  if (startMinutes === undefined || endMinutes === undefined) {
    return [];
  }

  return [
    {
      days,
      startMinutes,
      endMinutes
    }
  ];
}

export function blockToMeetings(block: StudentConstraintBlock): MeetingTime[] {
  const startMinutes = parseClockTime(block.startTime);
  const endMinutes = parseClockTime(block.endTime);

  if (startMinutes === undefined || endMinutes === undefined) {
    return [];
  }

  return [
    {
      days: block.days,
      startMinutes,
      endMinutes
    }
  ];
}

export function meetingsConflict(left: MeetingTime[], right: MeetingTime[]): boolean {
  for (const leftMeeting of left) {
    for (const rightMeeting of right) {
      const sharesDay = leftMeeting.days.some((day) => rightMeeting.days.includes(day));
      if (!sharesDay) {
        continue;
      }

      if (leftMeeting.startMinutes < rightMeeting.endMinutes && rightMeeting.startMinutes < leftMeeting.endMinutes) {
        return true;
      }
    }
  }

  return false;
}

export function meetingWindowPenalty(meetings: MeetingTime[], earliest?: string, latest?: string): number {
  const earliestMinutes = earliest ? parseClockTime(earliest) : undefined;
  const latestMinutes = latest ? parseClockTime(latest) : undefined;
  let penalty = 0;

  for (const meeting of meetings) {
    if (earliestMinutes !== undefined && meeting.startMinutes < earliestMinutes) {
      penalty += earliestMinutes - meeting.startMinutes;
    }
    if (latestMinutes !== undefined && meeting.endMinutes > latestMinutes) {
      penalty += meeting.endMinutes - latestMinutes;
    }
  }

  return penalty;
}
