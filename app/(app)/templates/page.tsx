import { Info } from "lucide-react";

import { TemplateGallery } from "@/components/templates/template-gallery";
import { TEMPLATES } from "@/lib/documents/templates";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-10 p-4 md:p-8">
      <header>
        <h1 className="font-heading text-[40px] font-bold leading-[1.15] tracking-tight text-on-surface">
          Template Gallery
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-6 text-on-surface-variant">
          Precision-engineered layouts optimized for applicant tracking systems
          and human readability.
        </p>
      </header>

      {/* ATS-safe explainer */}
      <div className="flex items-start gap-6 rounded-xl border border-coral-hi/20 bg-coral-hi/10 p-6 shadow-[0_0_20px_rgba(255,140,109,0.15)]">
        <div className="rounded-lg bg-coral-hi/20 p-3 text-coral-hi">
          <Info className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-coral-hi">
            Why &lsquo;ATS-safe&rsquo; matters
          </h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">
            Our high-compliance templates use{" "}
            <strong className="font-bold text-coral-hi">real text</strong>{" "}
            instead of images,{" "}
            <strong className="font-bold text-coral-hi">single column</strong>{" "}
            layouts for logical parsing, and avoid{" "}
            <strong className="font-bold text-coral-hi">tables</strong> that
            confuse automated scanners. Your resume will be readable by both
            machines and hiring managers.
          </p>
        </div>
      </div>

      <TemplateGallery templates={TEMPLATES} />
    </div>
  );
}
