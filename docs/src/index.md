---
layout: home
title: 'xStruct'
titleTemplate: 'A binary serialization library for TypeScript'
hero:
    name: 'xStruct'
    text: 'Binary serialization for TypeScript'
    tagline: Define a schema once, then serialize and deserialize Buffers with full type safety.
    actions:
        - theme: brand
          text: Get Started
          link: ./guide
        - theme: alt
          text: View on GitHub
          link: https://github.com/remotex-labs/xStruct
    image:
        src: /logo.png
        alt: 'xStruct logo'
features:
    - icon: 🧩
      title: Declarative schemas
      details: Describe a layout with a plain object and concise field strings such as u32le, f64be, or utf8[32].
    - icon: 🛡️
      title: Type-safe
      details: Parameterize a struct with an interface and let TypeScript check the objects you encode and decode.
    - icon: 🔢
      title: Rich numeric types
      details: 8, 16, 32, and 64-bit integers (64-bit as bigint) plus single and double floats, each with explicit endianness.
    - icon: 🧵
      title: Strings and arrays
      details: Fixed-size strings, multi-dimensional arrays, and variable-length text stored on the heap behind a pointer.
    - icon: 📥
      title: Heap pointers
      details: Variable-length fields live in a heap region behind a pointer, with a configurable 1, 2, 4, 6, or 8-byte pointer size.
    - icon: ⚡
      title: Bitfields and unions
      details: Pack sub-byte fields into a shared container, and overlap members at offset 0 with a union.
---
