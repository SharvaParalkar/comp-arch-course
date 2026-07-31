---
title: 02 | Cantilever Beams / Load Types
sidebar_position: 2
topic: foundations
tags:
  - Karamba
  - Grasshopper
  - Rhino
---
# Video: Intro to Karamba3D (Cantilever Beam, One Connection)

This video comes before the two-connection beam video. It stays even simpler: a single beam, fixed at **one** end only, free at the other. The same beam and support are reused three times, once for each of three different load types, so the full workflow (geometry, beam creation, supports, loads, analysis, results) gets repeated three times over with only the load definition changing. This is meant to introduce the FE pipeline itself before later videos add complexity.

Karamba3D is accessed through Grasshopper, which is built into Rhino.

## What you'll build

A single beam with a support at only one end (**fixed**, all 6 degrees of freedom locked) and the other end left completely free. That base beam and support get built once, then reused by three separate load branches on the same canvas:

1. A **Point Load** at the free end
2. A **Moment** at the free end
3. A **Uniformly Distributed Load (UDL)** across the whole span

Each branch gets its own Assemble Model → Analyze → ModelView/BeamView chain, so you can compare all three side by side.

## 1. Rhino setup

* Open Rhino and confirm your model units before placing geometry.
* Type `grasshopper` to open the Grasshopper canvas.
* Switch to the **3D** display.
* Turn on **grid snap** before placing points, same as usual, to keep geometry aligned.

## 2. Geometry: points and a line

1. Type `point` in Rhino and place 2 points:

   * Point 1: the fixed end (0, 0, 6)
   * Point 2: the free end (7, 0, 6)
2. Type `line` and connect the two points. This is a single 7-unit span, one continuous segment (unlike the two-connection beam, there's no need to break it into multiple segments here since there are no interior load points).
3. Press **F7** to hide the grid and clean up the viewport.

## 3. Bringing geometry into Grasshopper

* Place a **Curve** parameter (double-click the canvas, type `crv`), reference the single Rhino line into it.
* Add **Create Linear Element** (Karamba3D → Model), also labeled `LineToBeam`. Wire the Curve output into its **Line** input. This converts the line into a Karamba beam element. No cross-section or material override is applied here it runs on Karamba's default steel section, which is a separate topic for its own video.
* Add two **Point** parameters and reference the fixed-end point and the free-end point separately into each. Later steps (supports, loads) reference these by position instead of re-picking geometry each time.

This geometry the curve, the beam element, and the two reference points only gets built once. All three load branches below reuse it.

## 4. Supports

* Add a **Support** component (Karamba3D → Support). Wire the fixed-end Point into its position input.
* Check **all six degrees of freedom**: Tx, Ty, Tz, Rx, Ry, Rz. Locking all six at this one point is what makes this a **cantilever** rather than a simply-supported beam the free end is left completely unsupported, so everything the beam does has to react through this single fixed point.
* This Support component is also only built once and feeds into all three Assemble Model components below.

## 5. Point Load branch

1. Add a **Unit Z** component (double-click, type `unit z`).
2. Add a **Multiplication** component. Wire Unit Z into input **A**.
3. Add a **Number Slider**, wire it into input **B**, to control the load's magnitude.
4. Add a **Negative** component, route the slider's value through it, then into the Multiplication input, so the force vector points down instead of up.
5. Add a **Loads** component. Switch **Type of Load** to **Point Load**.
6. Wire the Multiplication output into the **Force** input.
7. Wire the free-end Point into the Loads position input.
8. Add an **Assemble Model** component. Wire in the beam element (**Elem**), the Support, and this Load.
9. Add an **Analyze** component fed by the Assemble Model output.
10. Add **ModelView** and **BeamView**, both fed by the Analyze output, to see the deformed shape and a stress/utilization color map.
11. Add **Beam Forces** (Karamba3D), wired to the Model, Beams|Ids, LCase, and ts. This outputs the raw numbers: N (axial), Vy/Vz (shear), Mt (torsion), My/Mz (bending moment).
12. Add **Displacements** (Karamba3D), wired the same way. This outputs Trans (translation) and Rot (rotation) at each point.
13. Add **Panel** components off of each output you want to read directly N, Vz, My, Trans, Rot, and so on so the raw values are visible on the canvas instead of just the color map.
14. Add a separate **Utilization** component to get the 0–1 (or higher) capacity ratio for this load case.

This is the most complete branch it's the one with the raw numeric output wired in, so it's the best one to reference when explaining what each result actually means.

## 6. Moment branch

1. Reuse the same slider → Unit Z → Negative → Multiplication pattern as the Point Load branch, but wire the output into the **Moment** input instead of the Force input.
2. On the Loads component, switch **Type of Load** to **Point**, if not already, so both a Force input and a Moment input are exposed on the same component.
3. Wire the free-end Point into the position input, same as before.
4. Add a separate **Assemble Model** for this branch, wiring in the same beam element and Support as before, but this Moment load instead.
5. Add its own **Analyze**, **ModelView**, and **BeamView**.
6. Add a **Utilization** component for this branch. No Beam Forces or Displacements panels are wired into this one only Utilization.

> Note: a moment vector is read as an **axis of rotation**, not a push direction. Unit Z, used as a moment axis, spins the free end sideways like a doorknob viewed from above rather than bending it up and down the way the Point Load and UDL branches do. To make this branch bend vertically and match the other two, the axis needs to be **Unit Y** instead of Unit Z.

## 7. UDL branch (Uniformly Distributed Load)

1. Add a **Beam Load** component instead of the point-based Loads component.
2. Switch its type to **Block**.
3. Set **t-Start = 0** and **t-End = 1** this applies the load across the full length of the beam (0% to 100% of its span), rather than at a single point.
4. Add a **Number Slider** labeled something like "UDL Magnitude kN-m" and wire it into the load magnitude input. Note the units here are **force per length**, not force alone a key difference from the other two branches.
5. Add a separate **Assemble Model**, again reusing the same beam element and Support, with this Beam Load instead.
6. Add its own **Analyze**, **ModelView**, and **BeamView**.
7. Add a **Utilization** component. Like the Moment branch, no Beam Forces or Displacements panels are wired in here only Utilization.

## 8. Comparing the three branches

Each branch's BeamView can be set to display **Utilization**, so all three color maps are read the same way (0–1 capacity ratio) even though the load itself is completely different in each case. Since the beam, the support, and the overall assemble → analyze → visualize pipeline are identical across all three, the load definition is the only variable being tested.

> Navigation tip: middle-mouse-click over a component to bring up a quick menu, then hit Zoom to snap your viewport to that part of the model useful once the canvas has three parallel branches on it.

## Recap: what each component does

| Component                             | Role                                                                                                            |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Curve                                 | Brings the single Rhino line into Grasshopper                                                                   |
| Create Linear Element (LineToBeam)    | Converts the line into a Karamba beam element (default cross-section/material)                                  |
| Point (x2)                            | Marks the fixed end and the free end for later reference                                                        |
| Support                               | Locks all 6 DOF at the fixed end only, making this a cantilever                                                 |
| Unit Z, Negative, Multiplication      | Builds a downward-pointing vector with adjustable magnitude, reused for both the Point Load and Moment branches |
| Loads (Point Load)                    | Applies the force vector at the free end                                                                        |
| Loads (Point, Moment input)           | Applies the same vector as a rotation about an axis at the free end                                             |
| Beam Load (Block, t-Start=0, t-End=1) | Applies a constant load across the full beam length                                                             |
| Assemble Model (x3)                   | Combines the shared beam and support with one load case each                                                    |
| Analyze (x3)                          | Solves each load case for displacements and internal forces                                                     |
| ModelView (x3)                        | Shows the deformed shape for each load case                                                                     |
| BeamView (x3)                         | Colors each beam by utilization for side-by-side comparison                                                     |
| Beam Forces / Displacements           | Only wired into the Point Load branch outputs raw N/Vz/My numbers and translation/rotation values               |
| Utilization (x3)                      | Gives the 0–1 capacity ratio for each load case                                                                 |

The beam element and support are built once and shared; everything downstream branches off that shared setup three times, once per load type.
