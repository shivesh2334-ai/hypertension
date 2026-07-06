# Hypertension - NG136 Clinical Decision Support Tool

Hypertension is a React-based clinical decision support application designed to guide healthcare professionals through the **NICE NG136** guidelines for the diagnosis and management of hypertension in adults.

## Features

- **Clinical Staging Engine**: Deterministic classification mirroring NG136 definitions (Stage 1, Stage 2, Stage 3 / severe hypertension).
- **Red Flag Identification**: Prompt identification of accelerated hypertension and suspected phaeochromocytoma to guide same-day specialist referral.
- **Target Organ Damage (TOD) Screening**: Integrated checklists for essential baseline investigations including ACR, HbA1c, Fundoscopy, and ECG.
- **Treatment Pathways**: Evidence-based algorithms tailored by age and ethnicity (e.g., Black African or African–Caribbean family origin).
- **Responsive UI**: Built with React, Tailwind CSS, and Lucide Icons for a clean, modern, and accessible user experience.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
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

## Technologies Used

- [React](https://react.dev/) - UI Library
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Iconography

## Disclaimer

This application is intended for educational and clinical decision support purposes only. It is not a substitute for professional clinical judgment. Always refer to the most current [NICE NG136 Guidelines](https://www.nice.org.uk/guidance/ng136) and local clinical policies.

## License

ISC License
