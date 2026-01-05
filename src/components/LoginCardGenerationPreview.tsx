"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function LoginCardGenerationPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 3);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative mx-auto max-w-xl">
      {/* Fake input area */}
      <div
        className={`rounded-xl border-2 bg-card p-5 shadow-sm transition-all duration-500 ${
          step >= 1 ? "border-primary/50 opacity-60 scale-[0.98]" : "border-border opacity-100 scale-100"
        }`}
      >
        <div className="mb-2 text-xs font-medium text-muted-foreground">
          Paste your course content
        </div>
        <div className="space-y-2 text-sm text-foreground/80">
          <p>
            Myocardial infarction occurs when an acute occlusion of a coronary artery leads to prolonged ischemia and necrosis of the heart muscle. Common symptoms include persistent chest pain radiating to the left arm, shortness of breath, nausea, and diaphoresis.
          </p>
        </div>
      </div>

      {/* AI processing indicator */}
      {step === 1 && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-xl">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
        </div>
      )}

      {/* Generated cards preview */}
      <div
        className={`mt-4 space-y-3 transition-all duration-700 ${
          step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Card preview 1 */}
        <div className="rounded-lg border bg-card p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Q
            </div>
            <div className="text-xs text-muted-foreground">1/2</div>
          </div>
          <p className="text-sm font-medium mb-3">What is a myocardial infarction?</p>
          <div className="border-t pt-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A myocardial infarction is the necrosis of heart muscle tissue caused by prolonged ischemia, usually due to acute coronary artery occlusion.
            </p>
          </div>
        </div>

        {/* Card preview 2 */}
        <div className="rounded-lg border bg-card p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-primary">
              Q
            </div>
            <div className="text-xs text-muted-foreground">2/2</div>
          </div>
          <p className="text-sm font-medium mb-3">What is the primary pathophysiological mechanism of myocardial infarction?</p>
          <div className="border-t pt-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              A
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Acute obstruction of a coronary artery, resulting in a sudden decrease in oxygen supply to the myocardium.
            </p>
          </div>
        </div>
      </div>

      {/* Badge */}
      {step >= 2 && (
        <div className="mt-3 flex justify-center animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-accent px-3 py-1 text-xs font-semibold text-white shadow-md">
            <Sparkles className="h-3 w-3" />
            AI Generated
          </div>
        </div>
      )}
    </div>
  );
}
