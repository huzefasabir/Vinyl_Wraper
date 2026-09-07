<div align="center">

# 🎨 VinylWrap AI Studio

**Architectural Surface Material Visualizer & Real-Time AI Wrapping Platform**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r185-black.svg?style=flat&logo=three.js)](https://threejs.org/)
[![Google Gemini API](https://img.shields.io/badge/Google_Gemini_AI-API_2.0-8E75B2.svg?style=flat&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB.svg?style=flat&logo=python)](https://www.python.org/)

---

*Transform interior architectural visualization with real-time PBR material rendering, AI-assisted surface recommendation, interactive SAM segmentation, and the complete Bodaq Architectural Film Catalog.*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture & Technology Stack](#️-system-architecture--technology-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Prerequisites & Environment Setup](#️-prerequisites--environment-setup)
- [🚀 Quickstart & Installation](#-quickstart--installation)
  - [1. Clone & Install Frontend Dependencies](#1-clone--install-frontend-dependencies)
  - [2. Set Up Python Backend Environment](#2-set-up-python-backend-environment)
  - [3. Configure Environment Variables](#3-configure-environment-variables)
  - [4. Launch Development Servers](#4-launch-development-servers)
- [🤖 AI & Computer Vision Capabilities](#-ai--computer-vision-capabilities)
  - [Google Gemini Surface Advisor](#google-gemini-surface-advisor)
  - [Hugging Face SAM & Grounding DINO Surface Segmentation](#hugging-face-sam--grounding-dino-surface-segmentation)
  - [OpenCV PBR Map Generator & Color Extraction](#opencv-pbr-map-generator--color-extraction)
- [📡 API Routes & Documentation](#-api-routes--documentation)
- [🖼️ PBR Material Catalog](#️-pbr-material-catalog)
- [🛠️ Build & Production Deployment](#️-build--production-deployment)
- [📄 License & Acknowledgments](#-license--acknowledgments)

---

## 🔬 Overview

**VinylWrap AI Studio** is a state-of-the-art SaaS web application engineered for architects, interior designers, commercial installers, and vinyl wrap applicators. 

The application enables users to upload photos of interior spaces (such as kitchens, doors, walls, cabinets, furniture, and office spaces), automatically segment surface elements using AI computer vision models, and seamlessly preview photorealistic **Bodaq architectural film finishes** in real-time 3D using PBR (Physically Based Rendering) material maps.

---

## ✨ Key Features

- 🛋️ **Interactive Studio Canvas**:
  - WebGL / Three.js interactive canvas powered by `@react-three/fiber` and `@react-three/drei`.
  - Custom WebGL fragment/vertex shaders for real-time PBR material blending, normal mapping, specular reflection, and roughness adjustments.
  - Interactive **Before / After Slider** for comparative visual evaluations.

- 📐 **Bodaq Architectural Film Catalog**:
  - Access to over 400+ high-resolution architectural vinyl finishes across categories:
    - **Wood Grain** (Oak, Walnut, Teak, Ash)
    - **Super Matt** & **Solid Colors**
    - **Stone & Marble** (Calacatta, Concrete, Granite)
    - **Natural Fabric & Textiles**
    - **Velvet & Metallic Finishes**
    - **Soft Leather & Specialty Materials**
  - Interactive technical inspection modal with PBR specifications (reflectivity, roughness, emboss depth, grain direction, thickness).

- 🧠 **AI Interior Surface Advisor (Google Gemini 2.0)**:
  - Multimodal Gemini AI model integration analyzing room photographs to recommend optimal architectural vinyl combinations based on ambient lighting, design aesthetic (Modern, Japandi, Industrial, Minimalist), and surface material durability.

- 🎯 **AI Surface Segmentation (SAM + Grounding DINO)**:
  - Integrated Hugging Face zero-shot segmentation (`SegmentAnything` + `GroundingDINO`).
  - Text-prompt guided or click-guided mask generation for precise surface isolated wrapping (e.g., "kitchen cabinets", "accent wall", "conference table").

- 🔮 **OpenCV Automated PBR Map Engine**:
  - Automated K-Means clustering for dominant Hex color extraction.
  - Automated Normal Map vector generation from bump maps using Sobel gradients.
  - Dynamic multi-side image cropping and texture scaling.

- 📤 **High-Res Export & Specification Sheets**:
  - Export final rendered scenes with customized finishes.
  - Download material specification cards for client proposals and installation planning.

---

## 🏗️ System Architecture & Technology Stack

```
                     ┌──────────────────────────────────────────────┐
                     │            React 19 + TypeScript             │
                     │          Vite + Tailwind CSS v4             │
                     │       Three.js / React Three Fiber           │
                     └──────────────────────┬───────────────────────┘
                                            │
                     ┌──────────────────────┴───────────────────────┐
                     │               HTTP / REST API                │
                     └──────────────┬────────────────┬──────────────┘
                                    │                │
            ┌───────────────────────┴──────┐  ┌──────┴───────────────────────┐
            │   Express / Node.js Proxy    │  │    FastAPI Python Backend    │
            │      - Gemini AI Gateway     │  │      - Catalog Management   │
            │      - Static Asset Server   │  │      - OpenCV PBR Pipeline   │
            └──────────────┬───────────────┘  │      - HF SAM / DINO Client  │
                           │                  └──────────────┬───────────────┘
            ┌──────────────┴───────────────┐                 │
            │      Google Gemini API       │  ┌──────────────┴───────────────┐
            │    (Multimodal AI Model)     │  │ Hugging Face Inference Space │
            └──────────────────────────────┘  └──────────────────────────────┘
```

### **Frontend**:
- **Framework**: React 19, TypeScript, Vite 6
- **Styling**: Tailwind CSS v4, Motion (Framer Motion)
- **3D Graphics & Shaders**: Three.js, `@react-three/fiber`, `@react-three/drei`
- **UI Icons & Utilities**: Lucide React, Canvas Confetti

### **Backend**:
- **Python FastAPI Service**: FastAPI, Uvicorn, Pydantic, Python-dotenv
- **Computer Vision & ML**: OpenCV (`cv2`), NumPy, Scikit-Learn, PyTorch, Torchvision, Pillow
- **AI Integrations**: Google Generative AI SDK (`@google/genai` & `google-generativeai`), Gradio Client (SAM/Grounding DINO)
- **Express / Node Server**: Express.js, TypeScript (`tsx`), Esbuild

---

## 📁 Project Structure

```
Vinyl_Wraper/
├── backend/                  # Python FastAPI Backend
│   └── app/
│       ├── api/              # API Endpoint Routes (route.py)
│       ├── core/             # Application Configuration & Logging
│       ├── services/         # Computer Vision & AI Services
│       │   ├── image_refine.py  # OpenCV Normal/Bump Map Generator & K-Means Color Extractor
│       │   └── volka_service.py # Hugging Face SAM + Grounding DINO Client
│       └── main.py           # FastAPI Application Entry Point
├── src/                      # React 19 Frontend Application
│   ├── components/           # UI Components
│   │   ├── three/            # Three.js 3D Viewers & Custom Shaders
│   │   │   ├── RoomVisualizer.tsx      # Main 3D Canvas
│   │   │   ├── MasterVinylMaterial.tsx # Custom PBR Vinyl Shader
│   │   │   └── MaskMesh.tsx            # Dynamic Surface Mask Rendering
│   │   ├── AiAdvisorModal.tsx    # Gemini AI Consultation Modal
│   │   ├── BeforeAfterSlider.tsx # Interactive Image Comparison Slider
│   │   ├── MaterialCatalog.tsx   # Architectural Catalog Browser
│   │   ├── HfSegmentationPage.tsx# SAM AI Surface Segmentation Interface
│   │   └── PbrModal.tsx          # Technical Spec Sheet Modal
│   ├── services/             # API Integration Clients
│   ├── types.ts              # TypeScript Type Definitions
│   ├── App.tsx               # Primary Application Shell & Routing
│   └── main.tsx              # React Entry Point
├── bodaq_cat.json            # Architectural Vinyl Film Database Catalog
├── server.ts                 # Integrated Express + Vite Node Server
├── requirements.txt          # Python Dependencies Manifest
├── package.json              # Node.js Dependencies & NPM Scripts
├── vite.config.ts            # Vite Configuration
└── metadata.json             # App Metadata Definition
```

---

## ⚙️ Prerequisites & Environment Setup

Ensure you have the following installed on your local development machine:

1. **Node.js**: `v18.0.0` or higher (Recommended: Node.js 20+)
2. **Python**: `v3.10` or higher (Recommended: Python 3.11)
3. **Google Gemini API Key**: Obtain a free or production key from [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Quickstart & Installation

### 1. Clone & Install Frontend Dependencies

```bash
# Clone repository
git clone https://github.com/your-org/Vinyl_Wraper.git
cd Vinyl_Wraper

# Install Node.js dependencies
npm install
```

### 2. Set Up Python Backend Environment

```bash
# Create a virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory (or update `.env.local`):

```env
# Google Gemini API Key for AI Interior Advisor
GEMINI_API_KEY=your_gemini_api_key_here

# Deployed Python FastAPI Backend Link (Render)
VITE_API_TARGET=https://vinyl-wraper-1.onrender.com
VITE_API_BASE_URL=https://vinyl-wraper-1.onrender.com/api
PYTHON_BACKEND_URL=https://vinyl-wraper-1.onrender.com
BACKEND_URL=https://vinyl-wraper-1.onrender.com

# Local Development Configuration
PORT=8000
HOST=0.0.0.0
EXPRESS_PORT=3000
```

### 4. Launch Development Servers

You can launch both the Python FastAPI backend and the Express/Vite frontend:

#### **Option A: Run Full Stack (Frontend + Node Express Server)**
```bash
npm run dev
```
*App will run at:* `http://localhost:3000` (or the port specified in terminal output).

#### **Option B: Run Python FastAPI Backend**
In a separate terminal (with `.venv` activated):
```bash
npm run dev:backend
# or directly:
python main.py
```
*FastAPI Interactive Docs (Local):* `http://localhost:8000/docs`  
*FastAPI Interactive Docs (Deployed Render):* `https://vinyl-wraper-1.onrender.com/docs`

---

## 🤖 AI & Computer Vision Capabilities

### Google Gemini Surface Advisor
- Located in `src/components/AiAdvisorModal.tsx` and `server.ts`.
- Uses Google Gemini 2.0 to accept image uploads of room interiors along with user preferences (e.g., modern aesthetic, high foot traffic, scratch-resistant).
- Generates tailored material recommendations matched directly to SKUs in the Bodaq Catalog.

### Hugging Face SAM & Grounding DINO Surface Segmentation
- Located in `backend/app/services/volka_service.py` and `src/components/HfSegmentationPage.tsx`.
- Connects to Hugging Face Inference Space (`Volkopat/SegmentAnythingxGroundingDINO`).
- Allows users to type prompts like `"kitchen island"`, `"front door"`, or `"wall panel"` to extract pixel-precise PNG alpha masks for vinyl wrap mapping.

### OpenCV PBR Map Generator & Color Extraction
- Located in `backend/app/services/image_refine.py`.
- **K-Means Hex Extraction**: Automatically calculates dominant RGB/Hex codes for texture swatches.
- **Normal Map Generation**: Converts grayscale bump heightmaps into RGB tangent-space normal maps via Sobel horizontal and vertical matrix kernels:
  $$\vec{N} = \text{normalize}\left(-\frac{\partial h}{\partial x}, -\frac{\partial h}{\partial y}, 1.0\right)$$

---

## 📡 API Routes & Documentation

- **Production Live Backend**: `https://vinyl-wraper-1.onrender.com`
- **Interactive OpenAPI Specs**: `https://vinyl-wraper-1.onrender.com/docs` (or local `http://localhost:8000/docs`)


### **Key Endpoints**:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health check |
| `GET` | `/api/materials` | Fetch filtered Bodaq vinyl catalog items |
| `GET` | `/api/materials/{code}` | Retrieve full PBR specs and details for a specific SKU |
| `GET` | `/api/categories` | Retrieve category summary & counts |
| `POST` | `/api/ai/advise` | AI interior surface recommendation (Gemini) |
| `POST` | `/api/segmentation/predict` | Run SAM + Grounding DINO surface segmentation |
| `POST` | `/api/refine/generate-maps` | Generate Normal, Bump, and Diffuse maps from raw image |
| `GET` | `/api/images/{path}` | Serve catalog high-res texture assets |

---

## 🖼️ PBR Material Catalog

The Bodaq catalog (`bodaq_cat.json`) includes complete technical PBR parameters for every material:
- **Diffuse Map**: High-resolution diffuse texture.
- **Normal Map**: Surface relief micro-geometry.
- **Bump Intensity**: Scale of embossed texture depth.
- **Roughness & Reflectivity**: Microfacet roughness parameter for specular highlights.
- **Grain Direction**: Directional orientation (Vertical / Horizontal / Omnidirectional).

---

## 🛠️ Build & Production Deployment

To generate production bundles for deployment:

```bash
# Build Vite frontend assets and bundle Express server
npm run build

# Start production server
npm run start
```

---

## 📄 License & Acknowledgments

- **Catalog Data**: Architectural film textures provided by Bodaq Architectural Finishes.
- **AI Models**: Powered by [Google Gemini AI](https://ai.google.dev/) & [Hugging Face](https://huggingface.co/).
- **3D Engine**: Built on top of [Three.js](https://threejs.org/) and [React Three Fiber](https://r3f.docs.pmnd.rs/).

---

<div align="center">
Developed for Architectural Surface Design & Interior Renovation Professionals.
</div>
