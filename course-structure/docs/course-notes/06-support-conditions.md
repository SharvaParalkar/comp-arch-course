---
title: 06 | Support Conditions
sidebar_position: 6
topic: foundations
tags:
  - Karamba
  - Grasshopper
  - Rhino
---
# Video 6: Support Conditions and Degrees of Freedom

## Introduction

In this lesson, the behavior of structural supports is explored using the same portal frame model from the previous video. The primary goal is to understand how different support conditions influence the way a structure responds to loads. Particular attention is given to the difference between fixed supports and pinned supports, and how these support conditions affect structural movement, internal forces, and overall performance.

The previous analysis assumed that all six degrees of freedom at the supports were restrained. While this simplified the behavior of the frame and helped illustrate the effects of point loads and self-weight, real structures often use a combination of support conditions. This lesson demonstrates how changing those support constraints alters the response of the structure.

# Degrees of Freedom

Every structural node can potentially move or rotate in three-dimensional space.

The six degrees of freedom are:

### Translational Degrees of Freedom

* Movement in the X direction
* Movement in the Y direction
* Movement in the Z direction

### Rotational Degrees of Freedom

* Rotation about the X axis
* Rotation about the Y axis
* Rotation about the Z axis

When a support restrains a degree of freedom, that movement or rotation is prevented. Different support types restrain different combinations of these six possible motions.

# Fixed vs. Pinned Supports

Both fixed and pinned supports prevent the base of a column from translating. In other words, neither support allows the base to slide horizontally or vertically.

The key difference is rotational restraint.

### Fixed Support

A fixed support restrains:

* Translation in X
* Translation in Y
* Translation in Z
* Rotation about X
* Rotation about Y
* Rotation about Z

All six degrees of freedom are locked.

Because rotation is prevented, a fixed support develops moments and generally provides greater stiffness to the structure.

### Pinned Support

A pinned support restrains:

* Translation in X
* Translation in Y
* Translation in Z

However, rotational movement is allowed.

Because the base can rotate, the structure behaves differently under load and generally experiences greater lateral displacement.

# Importance of Boundary Conditions

Boundary conditions describe how a structure is connected to its surroundings.

These conditions are critical because they determine:

* How loads travel through the structure
* Where internal forces develop
* The amount of structural deformation
* The overall stability of the system

Two structures with identical geometry and loading can behave very differently if their support conditions are changed.

The lesson emphasizes that boundary conditions are one of the most important factors controlling internal forces within a structure.

# Grasshopper Model Setup

The portal frame used throughout the lesson is generated parametrically within Grasshopper.

The model is constructed through the following sequence:

### 1. Point Creation

Number sliders define coordinates for several construct point components.

By changing the slider values, the location of the structural nodes can be adjusted.

Selecting a construct point component highlights the corresponding point in the Rhino viewport, making it easy to understand how the frame geometry is being created.

### 2. Line Generation

After the points are created, line components connect them together.

These lines represent the structural members:

* Left column
* Right column
* Spanning beam

### 3. Beam Conversion

The generated lines are converted into structural beam elements using the Line-to-Beam component.

These elements are then used for structural analysis.

### 4. Wind Loading

A wind load is applied to the frame.

The magnitude of this load can be modified parametrically using sliders, allowing different loading scenarios to be studied.

# Example 1: Fully Fixed Frame

## Support Configuration

Both column bases are fully fixed.

All six degrees of freedom are restrained at both supports.

### Structural Behavior

This configuration creates the stiffest frame among the three examples.

Because rotations are prevented at both bases:

* Lateral movement is minimized
* Larger moments develop at the supports
* The structure resists wind loads more effectively

### Utilization Results

The beam-view component displays utilization values for each member.

In this example:

* The two supporting columns show the highest utilization
* The spanning beam has the lowest utilization

The utilization values indicate how efficiently each member is being used relative to its capacity.

Because the supports are fully restrained, the frame distributes forces efficiently and performs well under lateral loading.

# Example 2: Fully Pinned Frame

## Support Configuration

Only translational movement is restrained.

The bases are free to rotate.

Three degrees of freedom remain locked while rotational restraint is removed.

### Structural Behavior

Allowing the bases to rotate significantly changes how the frame responds to loading.

Compared to the fixed frame:

* Lateral displacement increases
* Overall stiffness decreases
* Wind loads have a greater effect on the structure

As the wind load increases, the frame begins to deform much more noticeably.

### Utilization Results

The structural members experience higher utilization values.

Under larger wind loads, the frame approaches failure more quickly than the fully fixed case.

This demonstrates how rotational restraint contributes significantly to structural stability.

# Example 3: Mixed Support Conditions

## Support Configuration

One column base is fixed.

One column base is pinned.

This creates an asymmetric support condition.

### Structural Behavior

Because one side is restrained more than the other, load distribution becomes uneven.

The fixed side contributes more resistance to lateral movement, while the pinned side experiences greater deformation.

This causes the frame to behave differently than either the fully fixed or fully pinned cases.

### Utilization Results

Member utilization changes depending on which support is resisting the load.

The column receiving the wind load and lacking rotational restraint experiences the greatest stress demand.

The fixed column performs better because it is able to resist both forces and moments.

This example demonstrates how asymmetrical support conditions can significantly influence force distribution throughout a structure.

# Comparison of the Three Support Conditions

### General Observations

* Fixed supports create the stiffest structure.
* Pinned supports allow greater movement and larger deformations.
* Mixed supports produce asymmetric force distributions.
* Boundary conditions directly affect utilization, deformation, and structural performance.
* The same geometry can behave very differently depending on support restraints.

# Key Takeaways

1. Every structural node possesses six possible degrees of freedom.
2. Fixed supports restrain both translation and rotation.
3. Pinned supports restrain translation but allow rotation.
4. Boundary conditions strongly influence structural behavior.
5. Fixed frames generally resist lateral loads more effectively.
6. Pinned frames experience larger displacements under wind loading.
7. Mixed support conditions create asymmetric force paths and load distributions.
8. Structural analysis results such as utilization values are heavily dependent on support configuration.
9. Proper support selection is essential for achieving desired structural performance.
10. Understanding support conditions is fundamental to accurate structural modeling and analysis.
