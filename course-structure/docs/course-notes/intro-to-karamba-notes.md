---
title: Intro | Karamba Foundations Notes
sidebar_position: 2
topic: foundations
tags:
  - Karamba
  - Grasshopper
  - Rhino
---
# Video 1: Intro to Karamba3D (Beam Structure with Two Connections)

This is the first video in the Karamba3D series. It stays intentionally simple: a single beam, fixed at both ends, loaded at two interior points. The goal is to walk through the full workflow once (geometry, beam creation, supports, loads, analysis, and results) so every later video builds on this foundation.

Karamba3D is accessed through Grasshopper, which is built into Rhino.

## What you'll build

A beam with a support at each end (both ends **fixed**, not pin/roller) and two downward point loads applied at interior points along the beam. By the end, you'll see the beam visibly deform under load and view a color map showing where it's most stressed.

## 1. Rhino setup

- Open Rhino. Set your units before doing anything else: type `units`, and set the model units (e.g. feet) in the dialog. Confirm the unit shows correctly in the bottom left corner of the viewport.
- Type `grasshopper` to open the Grasshopper canvas. If you see a compatibility warning mentioning Karamba, ignore it, it doesn't apply here.
- In Grasshopper, switch to the **3D** display.
- Turn on **grid snap** in Rhino before placing points. This keeps everything aligned and makes the geometry easier to follow.

## 2. Geometry: points and lines

1. Type `point` in Rhino and place 4 points left to right:
   - Point 1: left support
   - Point 2: first load point
   - Point 3: second load point
   - Point 4: right support
2. Use spacebar to repeat the `point` command for each additional point.
3. Type `line` and connect them in order: support to load 1, load 1 to load 2, load 2 to support. This creates **3 separate line segments** covering the full span.
4. Press **F7** to hide the grid and clean up the viewport.

## 3. Bringing geometry into Grasshopper

- Place a **Curve** parameter (double-click the canvas, type `crv`). Right-click it, choose **Set Multiple Curves**, select all 3 line segments in Rhino, then press Enter.
- Karamba can't read curves directly as structural elements. Feeding a Curve straight into a Karamba component will throw a "data conversion failed from curve to element" error.
- Add **Create Linear Element** (Karamba3D → Model), also labeled `LineToBeam`. Wire the Curve output into its **Line** input. This converts the 3 curves into one continuous beam. Karamba reads shared endpoints and welds the segments into a single element.

> Tip: You can add any Grasshopper/Karamba component by double-clicking an empty spot on the canvas and typing its name, instead of hunting through the tab menus.

## 4. Assemble Model

- Add **Assemble Model** (Karamba3D). This is the component that will collect the beam, supports, and loads into one structural model.
- Wire the **Elem** output from Create Linear Element into the **Elem** input of Assemble Model.

## 5. Supports

- Add a **Point** parameter, right-click it, choose **Set Multiple Points**, then select the two **outer** points (the supports) in Rhino and press Enter.
- Add a **Support** component (Karamba3D → Support). Wire the Point output into its position input.
- On the Support component, check **all six degrees of freedom**: Tx, Ty, Tz, Rx, Ry, Rz. This fixes both translation and rotation at each support, so both ends are **fixed**, not pin/roller. Leaving any of these unchecked would let that support move or rotate freely in that direction, which isn't what we want here.
- Wire the Support output into the **Support** input of Assemble Model.

## 6. Loads

The Load component needs a force **vector** (direction and magnitude), not just a point.

1. Add a **Unit Z** component (double-click, type `unit z`). This gives a vector pointing straight up along Z by default.
2. Add a **Multiplication** component. Wire Unit Z into input **A**.
3. Add a **Number Slider** (double-click, type a number to auto-create one, e.g. `50`). Wire it into input **B**. Dragging this slider scales the load's magnitude.
4. **Direction check**: Unit Z points up by default, which will deform the beam the wrong way. Add a **Negative** component and route the slider's value through it (into the X input), then into the Multiplication input, so the force vector points **down** in the direction of gravity. Confirm the deformation direction flips correctly once this is wired in.
5. For finer control over load magnitude, delete the default number slider and replace it with one set to a smaller range. Double-click and type `0.01 < 10` to get a slider from 0.01 to 10 with fine steps.
6. Add a **Loads** component. By default it's set to **Gravity**, which applies uniformly across the whole beam by mass, not what we want, since the loads need to be local to the two middle points.
7. Click the **Type of Load** dropdown on the Loads component and switch it to **Point Load**. This adds a new position input.
8. Wire the Multiplication output into the **Force** input.
9. Add another Point parameter, right-click it, choose **Set Multiple Points**, then select the two **middle** points (the load points) and press Enter. Wire this into the new position input on Loads.
10. Wire the **Load** output into the **Load** input of Assemble Model.

## 7. Analyze and visualize

1. Take the **Model** output from Assemble Model and feed it into an **Analyze** component (double-click, type `analyze`, pick the first result).
2. Add a **ModelView** component (double-click, type `model view`). Wire the Model output into it. This shows the beam's deformed shape directly in the Rhino viewport.
3. If the deformation looks extreme, it's almost certainly the load multiplier value. Drag the number slider down to reduce it and watch the deformation scale down accordingly.
4. Click **Display** on the ModelView component to adjust how exaggerated the deformation appears, and to toggle the degrees of freedom icons at the supports on/off.
5. Add a **BeamView** component (double-click, type `beam view`). Wire the Model output into it. This wraps a pipe-like render around the beam.
6. Click **Display** on BeamView and select **Axial Stress**. Sections under the most stress render red; sections near the supports with less stress trend toward purple/blue.

> Navigation tip: middle-mouse-click over a component to bring up a quick menu, then hit Zoom to snap your viewport to that part of the model. Helpful when the canvas gets crowded.

## Recap: what each component does

| Component | Role |
|---|---|
| Curve | Brings the 3 Rhino line segments into Grasshopper |
| Create Linear Element (LineToBeam) | Converts the curves into one continuous beam element |
| Support | Marks the two outer points as fixed supports (all 6 DOF locked) |
| Unit Z, Negative, Multiplication | Builds a downward force vector with adjustable magnitude |
| Loads (Point Load) | Applies that force vector at the two middle points |
| Assemble Model | Combines the beam, supports, and loads into one structural model |
| Analyze | Solves the model for displacements and internal forces |
| ModelView | Shows the deformed shape |
| BeamView | Colors the beam by stress (axial stress, in this video) |

Support and Load components serve the same basic role as Create Linear Element: they translate Rhino geometry (points) into data Karamba can use for analysis. Assemble Model is where everything, geometry, constraints, and loads, comes together into the final model that gets analyzed.
