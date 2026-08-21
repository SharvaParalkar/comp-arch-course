---
title: 03 | Reading Analysis Results
sidebar_position: 3
topic: foundations
tags:
  - Karamba
  - Grasshopper
  - Rhino
---
# Video 3 Course Guide: Reading Analysis Results
*From Raw Numbers to a Design Decision*

This video is about what happens *after* the model solves. In previous videos you saw numbers come out of the analysis. Here we learn what those numbers actually mean and how to turn them into design decisions.

---

## What you’ll build / reuse

We deliberately reuse Video 2’s cantilever (one fixed end, free end, three parallel load branches: Point Load / Moment / UDL).

No new geometry is added. The entire teaching point is reading results on a structure you already understand, so nothing competes for attention.

Each branch already has:
- Beam Forces → Panel
- Beam Displacements → Panel
- Utilization of Elements → Panel
- Beam View set to Utilization (so the three color maps are directly comparable)

---

## 1. Core Idea: A Result Is Not a Verdict

Utilization is a ratio: **Demand / Capacity**.

| Utilization | What it actually means |
|-------------|------------------------|
| 0.0 | No load is active. Pure geometry, zero stress. |
| 0.0 – 0.6 | Over-building. Significant headroom left. You can usually remove material or lengthen the span. |
| 0.6 – 0.9 | Good working range. 10–40 % headroom remaining. Efficient but still safe. |
| 1.0 | At capacity. The member is using everything it has. |
| > 1.0 | Overstressed. Add capacity specifically where the color map is hottest (thicker section, different shape, etc.). |

Karamba is not a code-check tool that hands you a green check or a red X. It hands you a continuous signal that tells you what to do next.

---

## 2. Sign Conventions (they are physical, not arbitrary)

All Beam Forces values are reported in the **beam’s local axes**, not world XYZ.

- **N (Axial)**  
  Positive = tension (fibers stretching)  
  Negative = compression (fibers being squeezed)

- **Vy / Vz (Shear)**  
  Two separate components because the cross-section can be pushed sideways in either local direction.

- **My / Mz (Bending Moments)**  
  About the beam’s own cross-section axes. The sign tells you which face is in tension vs. compression. The diagram often flips sign at a support.

- **Mt (Torsion)**  
  Twisting moment about the beam axis.

Don’t just read the numbers off the panel — connect each one back to the physical action inside the beam.

---

## 3. Components used in this video

All of these were already placed in Videos 1 and 2. Today each one gets a clear explanation:

| Component | Role |
|-----------|------|
| Model View (Karamba3D) | Deformed shape of the whole model |
| Beam View (Karamba3D) | Color-coded utilization (or stress) along the beam |
| Beam Forces (Karamba3D) | N, Vy, Vz, Mt, My, Mz per element |
| Beam Displacements (Karamba3D) | Translation + rotation at each node (serviceability) |
| Utilization of Elements (Karamba3D) | 0–1+ ratio of demand vs. section capacity |
| Panel | Surfaces the raw numbers next to the color map |

---

## 4. Live walkthrough (what to do on camera)

1. Open the Video 2 / Video 3 file. Confirm the three branches are lined up side-by-side.
2. Enable Beam View on all three and set it to **Utilization**.
3. Start with the Point Load branch at zero load → everything shows zero / red error (no active load).
4. Increase the point load. Watch utilization climb.
5. Aim for the 0.6–0.9 range. Notice how lengthening or shortening the cantilever changes the utilization dramatically (longer cantilever → higher utilization for the same tip load).
6. Adjust the deformation scale in Model View / Beam View so the graphic isn’t exaggerated.
7. Briefly compare the three load cases side-by-side. The force diagrams and peak utilizations look completely different even though the beam and support never changed.

---

## 5. Common misconceptions to head off

- “Utilization under 1 means I’m done.” → No. It often means you are over-building.
- Treating displacement and utilization as the same check. They answer different questions (serviceability vs. strength) and can disagree.
- Assuming Beam Forces local axes match world XYZ. They do not.

---

## 6. Mini-challenge

Which of the three load cases (Point / Moment / UDL) produces the highest utilization without changing the cross-section?

Use the side-by-side color maps and the numeric panels to answer.

---

## Looking ahead – the other load cases & next video

In this video we focused most of the live demonstration on the **Point Load** branch because it is the clearest for watching utilization change in real time.

The Moment and UDL branches are already fully wired in the same file. Spend a few minutes after the video comparing them:

- Moment at the free end produces a very different moment diagram (and usually different peak utilization location).
- UDL spreads the demand along the entire length, so the color map and force diagrams look smoother / more distributed.

You will notice that the same physical beam can be under-utilized under one load type and closer to capacity under another. That is exactly why we keep all three branches visible.

In the **next video (Video 4 – Cross Sections & Materials)** we finally unlock the cross-section itself. You will keep the same geometry and loads, swap materials (timber / steel / concrete), change section dimensions, and run Optimize Cross Section so Karamba can pick a more efficient member from a list you supply. That is the moment where changing the *beam type* becomes the design variable.

Until then, treat every utilization number as a design signal, not a pass/fail stamp.
