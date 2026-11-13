/**
 * Demo Data Seeder for Development & Verification Only.
 *
 * NOTE: Strict compliance with SPEC.md:
 * "Never invent clinical content. Demo data must be obviously fake.
 * Any demo content must be obviously fake (for example 'Demo step 1'),
 * flagged as demo, and never loaded into production."
 */

import { DEMO_PROCEDURES, DEMO_SITE_SETTINGS } from "../src/data/demo-data";

async function main() {
  console.log("==================================================");
  console.log("Critical Ease Demo Data Verification & Seed Check");
  console.log("==================================================");

  console.log(`Site Name: ${DEMO_SITE_SETTINGS.site_name}`);
  console.log(`Tagline: ${DEMO_SITE_SETTINGS.tagline}`);
  console.log(`Total Published Starter Procedures: ${DEMO_PROCEDURES.length}`);

  for (const proc of DEMO_PROCEDURES) {
    const criticalSteps = proc.checklist_steps?.filter((s) => s.is_critical).length || 0;
    const arabicSteps = proc.checklist_steps?.filter((s) => s.text_ar).length || 0;

    console.log(`- [${proc.slug}] ${proc.title}`);
    console.log(`    Total Steps: ${proc.checklist_steps?.length || 0} (${criticalSteps} critical, ${arabicSteps} with Arabic)`);
    console.log(`    Equipment Items: ${proc.equipment_items?.length || 0}`);
    console.log(`    List Items: ${proc.list_items?.length || 0}`);

    // Verify all steps are obviously fake demo steps
    for (const step of proc.checklist_steps || []) {
      if (!step.text_en.toLowerCase().includes("demo")) {
        throw new Error(
          `VIOLATION of clinical rule: Step "${step.text_en}" does not include explicit "Demo" flag!`
        );
      }
    }
  }

  console.log("\nAll demo data verified: strictly compliant with clinical safety rule.");
}

main().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
