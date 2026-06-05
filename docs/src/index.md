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
          link: /guide
        - theme: alt
          text: View on GitHub
          link: https://github.com/remotex-labs/xStruct
    image:
        src: /logo.png
        alt: 'xStruct logo'
features:
    - icon: 🧩
      title: Declarative schemas
      details: Describe a layout with a plain object and concise field strings such as UInt32LE, FloatBE, or utf8(32).
    - icon: 🛡️
      title: Type-safe
      details: Parameterize a struct with an interface and let TypeScript check the objects you encode and decode.
    - icon: 🔢
      title: Rich numeric types
      details: 8, 16, and 32-bit integers, 64-bit BigInt, and single and double floats, each with explicit endianness.
    - icon: 🧵
      title: Flexible strings
      details: Length-prefixed, fixed-size, or null-terminated strings in UTF-8 and ASCII, plus string arrays.
    - icon: ⚡
      title: Bitfields
      details: Pack sub-byte fields into a shared integer container for compact protocols and registers.
    - icon: 📦
      title: Zero dependencies
      details: A small library with no runtime dependencies that runs anywhere a Buffer is available.
---
