"use client";

import React, { useState, useEffect, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, AlertCircle, FileText, ListChecks, Wrench, CheckSquare, Video, ChevronLeft, ChevronRight } from "lucide-react";
import { Procedure } from "@/types/database";
import { DetailsTab } from "@/components/admin/tabs/DetailsTab";
import { OverviewTab } from "@/components/admin/tabs/OverviewTab";
import { EquipmentTab } from "@/components/admin/tabs/EquipmentTab";
import { ChecklistTab } from "@/components/admin/tabs/ChecklistTab";
import { VideoTab } from "@/components/admin/tabs/VideoTab";
import { DisabledTab } from "@/components/admin/tabs/DisabledTab";
import {
  updateProcedureDetails,
  updateProcedureOverview,
  createProcedure,
} from "@/app/admin/actions/procedures";
import { AR_STRINGS } from "@/messages/ar";

type TabId = "details" | "overview" | "equipment" | "checklist" | "video";

interface ProcedureEditorProps {
  procedure?: Procedure | null;
  isNew?: boolean;
}

export function ProcedureEditor({ procedure, isNew = false }: ProcedureEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("details");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as TabId;
      if (tabParam && ["details", "overview", "equipment", "checklist", "video"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Unsaved changes guard on window close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleTabSwitch = (targetTab: TabId) => {
    if (activeTab === targetTab) return;
    if (isDirty) {
      const confirmLeave = window.confirm(AR_STRINGS.unsavedWarning);
      if (!confirmLeave) return;
    }
    setIsDirty(false);
    setFeedback(null);
    setActiveTab(targetTab);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", targetTab);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleSaveDetails = async (data: any) => {
    setFeedback(null);
    startTransition(async () => {
      if (isNew) {
        const res = await createProcedure(data);
        if (res.error) {
          setFeedback({ type: "error", message: res.error });
        } else if (res.procedureId) {
          setIsDirty(false);
          setFeedback({ type: "success", message: AR_STRINGS.saveSuccess });
          router.push(`/admin/procedures/${res.procedureId}`);
          router.refresh();
        }
      } else if (procedure) {
        const res = await updateProcedureDetails(procedure.id, data);
        if (res.error) {
          setFeedback({ type: "error", message: res.error });
        } else {
          setIsDirty(false);
          setFeedback({ type: "success", message: AR_STRINGS.saveSuccess });
          router.refresh();
        }
      }
    });
  };

  const handleSaveOverview = async (data: any) => {
    if (!procedure) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await updateProcedureOverview(procedure.id, data);
      if (res.error) {
        setFeedback({ type: "error", message: res.error });
      } else {
        setIsDirty(false);
        setFeedback({ type: "success", message: AR_STRINGS.saveSuccess });
        router.refresh();
      }
    });
  };

  const tabs = [
    { id: "details" as TabId, label: AR_STRINGS.tabDetails, icon: FileText, disabled: false },
    { id: "overview" as TabId, label: AR_STRINGS.tabOverview, icon: ListChecks, disabled: isNew },
    { id: "equipment" as TabId, label: AR_STRINGS.tabEquipment, icon: Wrench, disabled: false },
    { id: "checklist" as TabId, label: AR_STRINGS.tabChecklist, icon: CheckSquare, disabled: false },
    { id: "video" as TabId, label: AR_STRINGS.tabVideo, icon: Video, disabled: false },
  ];

  const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-scroll active tab into view on mobile
  const navRef = useRef<HTMLElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  const checkScroll = () => {
    const el = navRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 5) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      return;
    }
    const currentScroll = Math.abs(el.scrollLeft);
    setCanScrollStart(currentScroll > 10);
    setCanScrollEnd(currentScroll < maxScroll - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = navRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scrollActiveTabIntoView = useCallback((tabId: TabId) => {
    const el = tabRefs.current[tabId];
    const nav = navRef.current;
    if (!el || !nav) return;

    // Center the active tab horizontally to guarantee both left and right edges lie comfortably inside nav container
    el.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
    checkScroll();
  }, []);

  useEffect(() => {
    scrollActiveTabIntoView(activeTab);
  }, [activeTab, scrollActiveTabIntoView]);

  return (
    <div className="space-y-4">
      {/* Live Feedback Region (rendered only when feedback is active) */}
      <div aria-live="polite">
        {feedback && (
          <div
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-start mb-2 animate-in fade-in ${
              feedback.type === "success"
                ? "border border-success/30 bg-success-surface text-success"
                : "border border-danger/30 bg-danger-surface text-danger"
            }`}
          >
            {feedback.type === "success" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation Bar with Scroll Snap & Edge Fade Mask */}
      <div className="relative border-b border-border-subtle pb-px max-w-full overflow-hidden">
        {/* Start edge fade mask (RTL start) */}
        <div
          className={`pointer-events-none absolute inset-y-0 start-0 w-6 z-10 sm:hidden transition-opacity duration-200 ${
            canScrollStart ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "linear-gradient(to left, var(--color-page) 10%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* End edge fade mask (RTL end) */}
        <div
          className={`pointer-events-none absolute inset-y-0 end-0 w-6 z-10 sm:hidden transition-opacity duration-200 ${
            canScrollEnd ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "linear-gradient(to right, var(--color-page) 10%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <nav
          ref={navRef}
          role="tablist"
          className="flex items-center gap-1.5 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x px-2 py-0.5 no-scrollbar"
          aria-label="Procedure Editor Tabs"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isTabDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                disabled={isTabDisabled}
                onClick={() => handleTabSwitch(tab.id)}
                className={`snap-start shrink-0 inline-flex min-h-[44px] items-center gap-1.5 sm:gap-2 border-b-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-t-lg ${
                  isActive
                    ? "border-rose-dark text-rose-dark bg-white"
                    : "border-transparent text-text-secondary hover:border-border hover:text-navy"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className="squircle-card rounded-card border border-border-subtle bg-white p-4 sm:p-6 shadow-card-soft"
      >
        {activeTab === "details" && (
          <DetailsTab
            procedure={procedure}
            onSave={handleSaveDetails}
            setIsDirty={setIsDirty}
            isSaving={isSaving}
          />
        )}

        {activeTab === "overview" && procedure && (
          <OverviewTab
            procedure={procedure}
            onSave={handleSaveOverview}
            setIsDirty={setIsDirty}
            isSaving={isSaving}
          />
        )}

        {activeTab === "equipment" && procedure && (
          <EquipmentTab
            procedure={procedure}
            onDirtyChange={setIsDirty}
          />
        )}

        {activeTab === "checklist" && procedure && (
          <ChecklistTab
            procedure={procedure}
            onDirtyChange={setIsDirty}
          />
        )}

        {activeTab === "video" && procedure && (
          <VideoTab
            procedure={procedure}
          />
        )}

        {activeTab === "video" && !procedure && (
          <div className="p-6 text-center text-xs text-[var(--color-text-secondary)]">
            Please save basic procedure details first before uploading video.
          </div>
        )}
      </div>
    </div>
  );
}
