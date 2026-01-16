---
layout: post
title: Setting Up My First Lab Environment
description: My attempt to create a home lab for network testing - documenting failures and lessons learned
date: 2024-10-08
readTime: 5 min read
categories: [networking, hands-on]
tags: [Lab Setup, Hands-on]
---

Documenting my attempt to create a home lab for network testing. Spoiler alert: it didn't go as planned, but I learned a lot from the experience. Sometimes the best education comes from making mistakes and figuring out what went wrong!

## Why I Wanted a Lab

After reading about networking concepts and realizing I really don't know much about networks, I decided I needed a hands-on way to practice. Everyone says that the best way to learn networking is to actually work with networks, not just read about them. So I thought, "How hard could it be to set up a simple lab at home?"

Famous last words, right?

## My Original Grand Plan

I had this ambitious idea to create a lab with:

- Multiple virtual machines acting as different network nodes
- A virtual router to practice routing configurations
- Different subnets to understand network segmentation
- A firewall to learn about security rules
- A simple web server to test connectivity

It sounded reasonable in my head. I watched a few YouTube videos, read some blog posts, and thought I was ready to build my networking playground.

## Reality Check #1: Hardware Limitations

My first mistake was underestimating how much computing power I'd need. I tried to run 5 virtual machines on my laptop at the same time, each one supposed to act as a different network device. Within minutes, my laptop was making sounds I'd never heard before, and everything slowed to a crawl.

**Lesson learned:** Virtual labs need real resources. I had to scale back my plans significantly and start with just 2-3 VMs instead of the networking empire I originally envisioned.

## Reality Check #2: I Don't Know What I Don't Know

Once I got a more reasonable number of VMs running, I tried to configure them to talk to each other. This is where I discovered that knowing networking concepts in theory and actually implementing them are very different things.

I spent hours trying to figure out why my VMs couldn't ping each other, only to realize I had them on completely different virtual networks. Then when I fixed that, I couldn't understand why they could ping but not access web services. It turns out I had forgotten about firewalls (both software firewalls on the VMs and the virtual firewall rules).

**Lesson learned:** Start simple. Really, really simple. Like, "can two computers talk to each other" simple.

## Reality Check #3: Documentation Is Your Friend

After breaking and fixing things multiple times, I realized I wasn't keeping track of what I was doing. I'd make a change, something would work, then I'd make another change and something else would break, but I couldn't remember what I'd changed.

I started over and this time documented every single step. What IP addresses I assigned, what network settings I changed, what worked and what didn't. This made all the difference when things inevitably went wrong again.

**Lesson learned:** Write everything down. Your future self will thank you when you're trying to figure out why something that worked yesterday doesn't work today.

## What I Actually Achieved

By the end of my first lab setup attempt, I had:

- Two Ubuntu VMs that could ping each other
- A basic understanding of how virtual networks work in VirtualBox
- Experience configuring static IP addresses
- A simple web server running on one VM that the other could access
- A lot of notes about what doesn't work and why

It wasn't the complex multi-subnet, multi-router setup I had originally planned, but it was something that actually worked and that I understood.

## The Most Valuable Lessons

### 1. Start Small and Build Up

Don't try to build a enterprise-grade network on day one. Start with two devices talking to each other, then add complexity one piece at a time.

### 2. Embrace the Failures

Every time something didn't work, it forced me to understand why. Those failures taught me more about networking than just following a tutorial that works perfectly.

### 3. Virtual Labs Are Real Labs

Even though I was using virtual machines, the networking concepts were the same as they would be with physical hardware. The skills I learned setting up virtual networks translate directly to real network administration.

### 4. Documentation Saves Time

Keeping detailed notes about what I did, what worked, and what didn't work saved me countless hours of re-debugging the same problems.

## What's Next

Now that I have a basic two-VM setup working, I'm planning to gradually add complexity:

- Add a third VM and practice routing between subnets
- Set up a simple DHCP server
- Practice with basic firewall rules
- Learn about network monitoring tools

The key is to add one new element at a time, make sure I understand it completely, then move on to the next challenge.

## Encouragement for Fellow Beginners

If you're thinking about setting up your own lab but feeling intimidated, don't be! You will make mistakes. Things will break. You'll spend hours troubleshooting problems that seem simple in retrospect. That's not failure - that's learning.

Start with the simplest possible setup, document everything you do, and be patient with yourself. Every mistake is a lesson, and every small success builds toward understanding the bigger picture.

Remember: I really don't know much about networks, but I know more now than I did before I started this lab experiment. Progress is progress, no matter how small!