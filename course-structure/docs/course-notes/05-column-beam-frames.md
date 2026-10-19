---
title: 05 | Column + Beam Frames
sidebar_position: 5
topic: foundations
tags:
  - Karamba
  - Grasshopper
  - Rhino
---
# Video 5 Course Guide: Columns & Beam Frames

This guide covers the transition from **single-beam analysis** to a full **structural frame system** using connected members. By tracing load paths before solving, we evaluate how gravity and lateral wind loads travel through a portal frame to fully fixed ground supports.

---

## 1. Frame Geometry & Load Paths

**Portal Frame Geometry:**  
The structure consists of two **4-meter vertical columns** supporting a single **6-meter horizontal beam** spanning across their tops.

**Support Conditions:**  
Both column base nodes are **fully fixed**, locking all **6 degrees of freedom**.

**Gravity Load Path:**  
The self-weight of the top beam transfers to the supporting column joints below it, where forces travel down through the columns and discharge into the fixed base supports.

**Wind (Lateral) Load Path:**  
Applied as a horizontal point load pushing from **left to right** at a top beam node. The lateral force creates moment and shear forces that transfer down the columns into the ground foundations.

**Analysis Scope:**  
This initial frame analysis focuses on understanding **force paths and load transfer across interconnected elements** rather than code-checking column capacity.

---

## 2. Defining Script Geometry & Supports

### 1. Point Coordinates & Lines
Set up boundary points and connect them with line segments to construct the portal frame skeleton:

- **2 vertical columns**
- **1 horizontal span**
- Sliders control the total **frame height** and **span width**

### 2. Cross-Section & Material
Assign standard structural steel properties, such as **S235 steel**, and an **I-section profile** to the frame elements.

### 3. Element Conversion
Feed the lines and cross-section parameters into the **LineToBeam** component to convert the geometric lines into **Karamba structural members**.

### 4. Fixed Supports
Connect **Support** components to both column base nodes. Check all **6 degrees of freedom** to establish fully fixed base conditions.

---

## 3. Applying Gravity and Wind Loads

### Gravity Load — Self-Weight

Create the gravity load using a **Loads** component with its type set to **Gravity**. This automatically applies the self-weight of the structural elements downward.

### Lateral Wind Load

Construct the lateral load by generating a horizontal direction vector using **Unit X**.

Scale the force magnitude using **Multiplication** components, then feed the resulting vector into a **Point Load** component assigned to the top beam joint.

The resulting force pushes the frame horizontally from **left to right**.

---

## 4. Model Assembly & Sanity Checks

Before reviewing structural results, inspect the assembled model output to confirm proper element connectivity.

### Node Verification

Pass the assembled model nodes into a **List Length** component.

The model should contain exactly:

**4 structural joints**

- 2 base nodes
- 2 top frame joints

### Element Verification

Pass the beam element list into another **List Length** component.

The model should contain exactly:

**3 beam elements**

- 2 columns
- 1 top beam

Passing both checks verifies that the frame geometry and connectivity are configured correctly before solving.

---

## 5. Analyzing Results & Unit Verification

### Visualizing Displacement & Moments

Pass the solved model from **Analyze** into **ModelView** and **BeamView**.

Enable **Moment My** in **BeamView** to render the bending moment diagram across all frame members.

As the lateral wind load increases, the frame begins to **sway from left to right**, visibly deforming the columns and beam.

### Sample Utilization

Under combined loading, the capacity ratios vary across the frame members:

| Frame Member | Approx. Utilization |
|---|---:|
| **Left Column** | **47%** |
| **Top Beam** | **25%** |
| **Right Column** | **52%** |

The right column experiences the highest utilization in this example, while the top beam experiences the lowest.

---

## Unit Settings Pitfall & Fix

### Unit Mismatch

If Karamba units are set to **Imperial**, using an additional metric-to-imperial conversion component can incorrectly scale the applied load magnitudes.

This can result in **unrealistically large displacement values**.

### Resolution

Bypass the unnecessary conversion component by wiring the numeric sliders **directly into the load input**.

Always verify the **Karamba/Grasshopper unit settings** before interpreting structural results to ensure that loads, dimensions, and displacement values represent realistic structural behavior.

---

# Component Reference

| Component | Role in Workflow |
|---|---|
| **Loads (Gravity)** | Automatically calculates and applies downward self-weight across all frame members. |
| **Unit X + Multiplication** | Constructs the scaled horizontal force vector from left to right for the lateral wind load. |
| **LineToBeam** | Converts Rhino/Grasshopper lines into Karamba beam elements with assigned steel profiles. |
| **List Length** | Performs structural checks to verify the node count (**4**) and beam count (**3**). |
| **BeamView (My)** | Visualizes bending moment diagrams and utilization color maps across the portal frame. |
| **Beam Displacements** | Outputs numerical translation and rotation values for checking lateral drift and joint deflections. |
