// lib/generateASS.ts
// Converts an array of timed lyric lines into an ASS (Advance SubStation Alpha) subtitle file
// with karaoke-style active/inactive line styling

export interface LyricLine {
  text: string;
  startMs: number;
  endMs: number;
}

export interface ASSOptions {
  highlightColor: string; // hex e.g. "#a855f7"
  fontName: string; // e.g. "Poppins"
  fontSize: number; // e.g. 52
  resolution: string; // e.g. "1920x1080"
  outlineEnabled: boolean;
}

// Convert hex "#rrggbb" → ASS BGR format "&H00BBGGRR"
function hexToASS(hex: string): string {
  const c = hex.replace("#", "");
  const r = c.slice(0, 2);
  const g = c.slice(2, 4);
  const b = c.slice(4, 6);
  return `&H00${b}${g}${r}`.toUpperCase();
}

// Convert milliseconds to ASS time "H:MM:SS.CS"
function msToASSTime(ms: number): string {
  const total = ms / 1000;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = Math.floor(total % 60);
  const cs = Math.round((total % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

export function generateASS(lines: LyricLine[], options: ASSOptions): string {
  const [width, height] = options.resolution.split("x").map(Number);
  const highlightASS = hexToASS(options.highlightColor);
  const whiteASS = "&H00FFFFFF";
  const dimmedASS = "&H80AAAAAA"; // 50% transparent grey
  const outlineColor = "&H00000000";
  const fontSize = options.fontSize;
  const fontSmall = Math.round(fontSize * 0.72);

  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${width}
PlayResY: ${height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
; Active line — highlighted, large, center-bottom
Style: Active,${options.fontName},${fontSize},${highlightASS},${highlightASS},${outlineColor},&H80000000,-1,0,0,0,100,100,0,0,1,${options.outlineEnabled ? 3 : 0},2,2,40,40,60,1
; Inactive lines — dimmed and smaller
Style: Inactive,${options.fontName},${fontSmall},${dimmedASS},${dimmedASS},${outlineColor},&H80000000,0,0,0,0,100,100,0,0,1,${options.outlineEnabled ? 2 : 0},1,2,40,40,60,1
; Next line preview — slightly brighter than inactive
Style: Next,${options.fontName},${fontSmall},${whiteASS},${whiteASS},${outlineColor},&H80000000,0,0,0,0,100,100,0,0,1,${options.outlineEnabled ? 2 : 0},1,2,40,40,80,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events: string[] = [];

  lines.forEach((line, i) => {
    const start = msToASSTime(line.startMs);
    const end = msToASSTime(line.endMs);

    // Active line (highlighted, foreground)
    events.push(
      String.raw`Dialogue: 0,${start},${end},Active,,0,0,0,,{\an2}${line.text}`,
    );

    // Show previous line dimmed above active (if exists)
    if (i > 0) {
      const prev = lines[i - 1];
      events.push(
        String.raw`Dialogue: 0,${start},${end},Inactive,,0,0,0,,{\an2\pos(${Math.round(width / 2)},${height - 160})}${prev.text}`,
      );
    }

    // Show next line preview below active (if exists)
    if (i < lines.length - 1) {
      const next = lines[i + 1];
      events.push(
        String.raw`Dialogue: 0,${start},${end},Next,,0,0,0,,{\an2\pos(${Math.round(width / 2)},${height - 40})}${next.text}`,
      );
    }
  });

  return header + events.join("\n") + "\n";
}
