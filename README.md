# Hypertension - NG136 Clinical Decision Support Tool

Hypertension is a React-based clinical decision support application designed to guide healthcare professionals through the **NICE NG136** guidelines for the diagnosis and management of hypertension in adults.

## Features

- **Rules-based assessment**: Immediate results for BP classification, confirmation, organ damage screening, treatment guidance and urgent review. The clinical rules distinguish clinic readings from home and daytime ambulatory averages.
- **Ask Claude**: Free-text hypertension questions with linked NICE NG136, Indian Guidelines on Hypertension V and 2025 ACC/AHA references, plus implementation context from the CSI journal. Responses cover urgency, investigations, treatment, diet, exercise and follow-up. Use de-identified cases.
- **Claude second review**: Optional server-side review on Vercel. Missing configuration, timeouts and invalid replies leave the rules-based result available.
- **Red Flag Identification**: Prompt identification of accelerated hypertension and suspected phaeochromocytoma to guide same-day specialist referral.
- **Target Organ Damage (TOD) Screening**: Integrated checklists for essential baseline investigations including ACR, HbA1c, Fundoscopy, and ECG.
- **Treatment Pathways**: Evidence-based algorithms tailored by age and ethnicity (e.g., Black African or African–Caribbean family origin).
- **Responsive UI**: Built with React, Tailwind CSS, and Lucide Icons for a clean, modern, and accessible user experience.

## Getting Started

### Prerequisites

- Node.js 22.12+ (Node.js 24 recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shivesh2334-ai/hypertension.git
   ```
2. Navigate to the project directory:
   ```bash
   cd hypertension
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build

To create a production build:
```bash
npm run build
```

## Vercel configuration

Set `ANTHROPIC_API_KEY` as a server-side Vercel environment variable to enable both Claude features. Ask Claude defaults to `claude-haiku-5-5` and uses the curated reference summaries in `knowledge/hypertension-guidelines.js`. Optionally set `ANTHROPIC_MODEL` to an available Claude model. Vite's local dev server runs the rules-based assessment and serves the bundled NICE PDF. Use `vercel dev` to exercise the server route locally.

## Technologies Used

- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Iconography

## Disclaimer

This application is intended for educational and clinical decision support purposes only. It is not a substitute for professional clinical judgment. Always refer to the most current [NICE NG136 Guidelines](https://www.nice.org.uk/guidance/ng136) and local clinical policies.

## License

ISC License
