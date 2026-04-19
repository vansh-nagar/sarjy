export interface RoseCurveVariant {
  petalCount: number;
  durationMs: number;
  trailSpan: number;
  rotationDurationMs: number;
}

export interface AzureVoice {
  value: string;
  label: string;
  gender: "Male" | "Female";
  variant: RoseCurveVariant;
}

export const AZURE_VOICES: AzureVoice[] = [
  { value: "en-US-JennyMultilingualNeural", label: "Jenny", gender: "Female",
    variant: { petalCount: 7, durationMs: 4600, trailSpan: 0.38, rotationDurationMs: 28000 } },
  { value: "en-US-AriaNeural", label: "Aria", gender: "Female",
    variant: { petalCount: 5, durationMs: 4200, trailSpan: 0.42, rotationDurationMs: 22000 } },
  { value: "en-US-MichelleNeural", label: "Michelle", gender: "Female",
    variant: { petalCount: 3, durationMs: 3800, trailSpan: 0.30, rotationDurationMs: 18000 } },
  { value: "en-US-SaraNeural", label: "Sara", gender: "Female",
    variant: { petalCount: 4, durationMs: 5000, trailSpan: 0.35, rotationDurationMs: 32000 } },
  { value: "en-US-AmberNeural", label: "Amber", gender: "Female",
    variant: { petalCount: 6, durationMs: 4400, trailSpan: 0.40, rotationDurationMs: 25000 } },
  { value: "en-US-ElizabethNeural", label: "Elizabeth", gender: "Female",
    variant: { petalCount: 8, durationMs: 5200, trailSpan: 0.36, rotationDurationMs: 30000 } },
  { value: "en-US-GuyNeural", label: "Guy", gender: "Male",
    variant: { petalCount: 9, durationMs: 4800, trailSpan: 0.44, rotationDurationMs: 20000 } },
  { value: "en-US-DavisNeural", label: "Davis", gender: "Male",
    variant: { petalCount: 11, durationMs: 3600, trailSpan: 0.32, rotationDurationMs: 24000 } },
  { value: "en-US-ChristopherNeural", label: "Christopher", gender: "Male",
    variant: { petalCount: 5, durationMs: 4600, trailSpan: 0.50, rotationDurationMs: 26000 } },
  { value: "en-US-EricNeural", label: "Eric", gender: "Male",
    variant: { petalCount: 3, durationMs: 3200, trailSpan: 0.28, rotationDurationMs: 16000 } },
  { value: "en-US-RogerNeural", label: "Roger", gender: "Male",
    variant: { petalCount: 4, durationMs: 5400, trailSpan: 0.45, rotationDurationMs: 35000 } },
  { value: "en-US-TonyNeural", label: "Tony", gender: "Male",
    variant: { petalCount: 6, durationMs: 4000, trailSpan: 0.38, rotationDurationMs: 22000 } },
];

export const DEFAULT_VOICE = AZURE_VOICES[0].value;
