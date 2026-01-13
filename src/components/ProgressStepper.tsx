"use client";

import { useMemo } from "react";

export type WorkflowStep = "upload" | "review" | "results";

interface Step {
  id: WorkflowStep;
  name: string;
  description: string;
}

const STEPS: Step[] = [
  { id: "upload", name: "Upload", description: "Import feedback" },
  { id: "review", name: "Review", description: "Edit & approve" },
  { id: "results", name: "Results", description: "View Linear issues" },
];

export interface ProgressStepperProps {
  currentStep: WorkflowStep;
  completedSteps?: WorkflowStep[];
}

export function ProgressStepper({
  currentStep,
  completedSteps = [],
}: ProgressStepperProps) {
  const stepStates = useMemo(() => {
    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    return STEPS.map((step, index) => {
      if (completedSteps.includes(step.id) || index < currentIndex) {
        return "completed";
      }
      if (step.id === currentStep) {
        return "current";
      }
      return "upcoming";
    });
  }, [currentStep, completedSteps]);

  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const state = stepStates[index];
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full
                    font-semibold text-sm transition-all duration-300
                    ${state === "completed"
                      ? "bg-green-500 text-white"
                      : state === "current"
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50"
                        : "bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                    }
                  `}
                  aria-current={state === "current" ? "step" : undefined}
                >
                  {state === "completed" ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-sm font-medium ${
                      state === "current"
                        ? "text-blue-600 dark:text-blue-400"
                        : state === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
              {!isLast && (
                <div
                  className={`
                    w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 transition-colors duration-300
                    ${stepStates[index + 1] === "upcoming"
                      ? "bg-zinc-200 dark:bg-zinc-700"
                      : "bg-green-500"
                    }
                  `}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
