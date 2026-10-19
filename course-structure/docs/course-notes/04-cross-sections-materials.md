---
title: 04 | Cross Sections & Materials
sidebar_position: 4
topic: foundations
tags:
  - Karamba
  - Grasshopper
  - Rhino
related: []
---
# Video 4 Course Guide: Cross-Sections & Materials

This guide demonstrates how material selection directly influences structural performance and utilization in Karamba3D by testing timber, steel, and concrete under identical load conditions, followed by automated cross-section optimization.

## 1. Modulus of Elasticity (E) and Stiffness

By reusing identical beam geometry and loading conditions, material selection is isolated as the single testing variable:

* **Modulus Value (E):** Represents real-world material stiffness in structural calculations.
* **Relative Stiffness:** Steel exhibits a significantly higher stiffness ($E$) compared to timber.
* **Custom Material Definitions:** Material property values can be sourced online for specific species of wood or alloys and plugged directly into Grasshopper material components.

---

## 2. Shared Setup and Script Structure

Although the Grasshopper canvas contains many wires, the workflow isolates variables across parallel branches using a single base beam setup:

1. **Load Magnitudes and Reference Points:** Defines the force inputs and point coordinates at the top of the canvas.
2. **Dimension Sliders:** Control global beam geometry (length, width, and cross-section dimensions) across all material branches.
3. **Material Property Inputs:** Feeds material values into individual **Cross Section** components to define beam geometry and stiffness.
4. **Element Conversion:** Converts curves/lines into Karamba elements (**LineToBeam**) with linked cross-section definitions.
5. **Analysis Pipeline:** Routes elements through **Assemble Model** → **Analyze** → **ModelView** / **BeamView** → **Utilization** → **Panel**.
6. **Multi-Segment Outputs:** The beam is divided into three distinct segments, generating three separate utilization readings in the output panels.

---

## 3. Comparing Timber, Steel, and Concrete

When applying an identical load across identical beam spans, lengths, widths, and cross-section shapes, each material yields distinct utilization levels:

| Material | Utilization Ratio | Structural Characteristics & Trade-offs |
| :--- | :--- | :--- |
| **Timber** | ~0.866 | Highest utilization under load. Less structurally strong than steel or concrete, but provides desirable aesthetic and visual qualities. |
| **Steel** | ~0.03 | Extremely low utilization. Very structurally sound and stiff, but comes at a higher material cost. |
| **Concrete** | ~0.42 | Mid-range utilization. Highly common structural material; performs well under compression but is brittle and weak in shear/tension (fails when pulled). |

---

## 4. Automated Cross-Section Optimization

The **Optimize Cross Section** component automatically selects the most efficient beam profile from a library of candidate cross-sections based on a target utilization ratio.

### Optimization Pipeline

1. **Base Assembly:** Assign an initial profile (such as an I-section) to the beam lines, convert them to elements, and assemble the base model.
2. **Target Utilization Slider:** Connect a slider to define the precise target utilization (e.g., targeting a ratio of 0.60).
3. **Candidate Selection & Toggles:** Supply candidate lists of cross-sections across material types (steel, timber, concrete). Boolean toggles enable or disable specific sections from the pool (e.g., toggling an item list count between 11 and 12 profiles).
4. **Optimization Solving:** Route the merged candidate list and assembled model into the **Optimize Cross Section** component.
5. **Deconstructing Output:** Pass the optimized model output into **Disassemble Model**, **Disassemble Elements**, and **Disassemble Cross Section** components to reveal which section profile was selected.

### Demonstration Behaviors

* Setting a target utilization of **0.02** causes Karamba to select a **Steel 10x5.3** section.
* Increasing the target utilization to **0.60** causes the component to select a different, lighter steel profile to closely match the higher target efficiency.
* Adjusting target thresholds and candidate libraries causes Karamba to automatically evaluate and switch between concrete, steel, or timber profiles.

---

## Component Reference

| Component | Role in Workflow |
| :--- | :--- |
| **Material Properties** | Defines material stiffness ($E$ value) from physical lookups. |
| **Cross Section** | Assigns geometric shapes, dimensions, and material properties to beam sections. |
| **Optimize Cross Section** | Solves for and selects the ideal cross-section from a candidate pool to match a target utilization. |
| **Disassemble (Model / Elements / Cross Section)** | Deconstructs the optimized structural model to extract and read the specific profile selected by Karamba. |
