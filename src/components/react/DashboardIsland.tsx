/**
 * React island wrapper for the Dashboard.
 * Imports the existing Dashboard page component and re-exports it
 * as a standalone component for Astro's client:load directive.
 */
import "@/i18n"; // Initialize i18next (side effect)
import Index from "./DashboardPage";

export default Index;
