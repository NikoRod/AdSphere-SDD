# AdSphere — Spec-Driven Campaign Orchestration Platform

> Plataforma frontend-first para la gestión de campañas publicitarias digitales, construida bajo un enfoque de **Spec-Driven Development (SDD)**.

---

## Tabla de Contenidos

1. [Project Overview](#1-project-overview)
2. [Contexto de Negocio](#2-contexto-de-negocio)
3. [Core Feature: Campaign Builder](#3-core-feature-campaign-builder)
4. [Spec-Driven Development Strategy](#4-spec-driven-development-strategy)
5. [Stack Tecnológico](#5-stack-tecnológico)
6. [Arquitectura](#6-arquitectura)
7. [Estructura de Carpetas orientada a SDD](#7-estructura-de-carpetas-orientada-a-sdd)
8. [Ejemplo de Spec Real](#8-ejemplo-de-spec-real)
9. [Contrato Derivado](#9-contrato-derivado)
10. [Testing Strategy](#10-testing-strategy)

---

## 1. Project Overview

AdSphere es una plataforma **frontend-first** diseñada para gestionar campañas publicitarias digitales. 

El proyecto fue desarrollado bajo un enfoque **Spec-Driven Development (SDD)**, donde cada feature se construye a partir de especificaciones formales y contratos explícitos.

### Objetivos del Proyecto

El objetivo del proyecto es demostrar:

- Arquitectura frontend moderna
- Contract-first development
- Separación estricta de responsabilidades (Domain, Application, UI)
- Validaciones robustas con máquinas de estado finitas y tipos discriminados

---

## 2. Contexto de Negocio

La industria de **Digital Out-of-Home (DOOH)** requiere:

- Gestión eficiente de múltiples pantallas
- Validaciones estrictas de fechas, horarios y assets multimedia
- Interfaces reactivas y predecibles

AdSphere modela estos requerimientos en un sistema **desacoplado y altamente tipado**.

---

## 3. Core Feature: Campaign Builder

Dado el objetivo del proyecto, se ha implementado un vertical slice profundo de la funcionalidad principal: **La Creación de Campañas (Campaign Builder).**

Esta feature abarca:
- Formulario de UI completamente reactivo (`CampaignForm.tsx`).
- Validación pura de reglas de negocio en la capa de dominio (`campaign.rules.ts`).
- Máquina de estados exhaustiva para transición de ciclo de vida (`campaign.machine.ts`).
- Schemas strictos con Zod para blindar el dominio (`campaign.schema.ts`).
- Casos de uso de aplicación separados (`validateCampaign.usecase.ts`).

---

## 4. Spec-Driven Development Strategy

### ¿Qué significa SDD en este proyecto?

En AdSphere, cada feature sigue un ciclo formal basado en especificaciones:

| Elemento              | Descripción                                      |
|-----------------------|--------------------------------------------------|
| `.spec.md`            | Documento de especificación de la feature        |
| Estados posibles      | Todos los estados válidos del sistema            |
| Contratos de datos    | Tipos y estructuras de entrada/salida            |
| Errores               | Casos de error explícitamente definidos          |
| Reglas de negocio     | Invariantes que el código debe respetar          |

**Principios fundamentales:**

- El código **solo implementa** lo que la spec permite.
- **No existe** comportamiento implícito.

---

## 5. Stack Tecnológico

| Tecnología                  | Rol                              |
|-----------------------------|----------------------------------|
| **Next.js** (App Router)    | Framework principal              |
| **React 18+**               | UI rendering en cliente          |
| **TypeScript** (strict)     | Tipado estático y State Unions   |
| **TailwindCSS**             | Estilos utilitarios de UI        |
| **Zod**                     | Validación en runtime de payloads|
| **Vitest**                  | Testing puro (Domain y State)    |

---

## 6. Arquitectura

### Principios

- UI completamente **desacoplada**.
- App Cases (Use Cases) orquestan el flujo.
- Domain logic **pura y testeable** por diseño.
- **Mappers/Schemas** defienden las fronteras del dominio.
- **No hay lógica de negocio en JSX**.
- Transiciones explícitas mediante Eventos y Estados.

---

## 7. Estructura de Carpetas orientada a SDD

```
/root
├── /app
│   └── page.tsx
├── /features
│   └── /campaign
│       ├── /spec
│       │   └── campaign.spec.md
│       ├── /domain
│       │   ├── campaign.state.ts
│       │   ├── campaign.rules.ts
│       │   ├── campaign.validation.ts
│       │   ├── campaign.schema.ts
│       │   └── campaign.machine.ts
│       ├── /application
│       │   └── validateCampaign.usecase.ts
│       ├── /ui
│       │   └── CampaignForm.tsx
│       └── /tests
│           ├── campaign.rules.test.ts
│           └── campaign.machine.test.ts
```

---

## 8. Ejemplo de Spec Real

> Archivo: `features/campaign/spec/campaign.spec.md`

```markdown
# Feature: Campaign Creation

## Purpose
Allow a user to create a campaign that schedules ads on multiple screens within a date range.

## Business Rules
1. startDate must be before endDate
2. timeSlots must not overlap
3. mediaAsset must match allowed format
4. screenIds must not be empty

## States
- idle
- editing
- validating
- invalid
- conflict_detected
- ready_to_publish
- published
- error
```

---

## 9. Contrato Derivado

El contrato TypeScript se genera directamente a partir de los estados definidos en la spec (`features/campaign/domain/campaign.state.ts`):

```typescript
export type CampaignCreationState =
  | { status: "idle" }
  | { status: "editing"; draft: CampaignDraft }
  | { status: "validating"; draft: CampaignDraft }
  | { status: "invalid"; draft: CampaignDraft; errors: NonEmptyArray<ValidationError> }
  | { status: "conflict_detected"; draft: CampaignDraft; conflicts: Conflict[] }
  | { status: "ready_to_publish"; draft: CampaignDraft }
  | { status: "published"; campaignId: string }
  | { status: "error"; message: string };
```

---

## 10. Testing Strategy

Los tests están **derivados directamente** de la spec, no del código impredecible:

| Tipo de Test                     | Descripción                                          |
|----------------------------------|------------------------------------------------------|
| Tests de reglas de negocio       | `campaign.rules.test.ts` valida cada regla descrita en la spec (fechas, horas, asserts multimedia). |
| Tests de transición de estado    | `campaign.machine.test.ts` cubre transiciones exhaustivas asegurando que los fallos no muten estados incorretos. |
| Tests de validación con Zod      | Evaluados integradamente para garantizar la integridad estructural y formato inicial de los payload externos. |

---

*Documentación generada bajo enfoque Spec-Driven Development — AdSphere v1.0*