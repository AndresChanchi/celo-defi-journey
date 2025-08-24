# 🧠 Lo que aprendí en el ejercicio de Vault Lock

Durante este ejercicio aprendí cómo funciona el bloqueo de fondos en un contrato inteligente. Me pareció muy interesante ver cómo Solidity permite definir condiciones de tiempo para liberar recursos, y cómo eso puede aplicarse a casos reales como pagos diferidos, freelance, o acuerdos entre partes.

También me dio curiosidad cómo funciona Solidity por dentro. Me di cuenta de que hay mucha abstracción, pero también muchos detalles que pueden ser peligrosos si no se entienden bien. Por ejemplo, el tema de **reentrancy** me sorprendió bastante: una simple variable mal ubicada puede abrir la puerta a un bug que permite robar fondos infinitamente. Literalmente, un error puede significar dinero perdido.

Otra cosa que descubrí es que Solidity es más simple de lo que pensaba. Se pueden firmar contratos, definir estructuras claras, y el lenguaje tiene una sintaxis bastante accesible. Sin embargo, hay conceptos como `storage`, `memory` y `calldata` que afectan el costo de ejecución, y eso me dejó con ganas de investigar más sobre optimización avanzada.

---

## ❓ Dudas y reflexiones personales de mi Celo DeFi Journey

Estas son observaciones que hice durante la clase y el ejercicio. No estoy seguro si están bien o no, pero las dejo aquí como preguntas abiertas para que el profesor pueda comentarlas:

- ¿Es cierto que algunos tipos de memoria como `storage` son más caros, pero pueden aprovecharse mejor si se domina Solidity avanzado?
- ¿Se pueden hacer contratos con **fees gratis** en Celo? ¿O eso depende del diseño del protocolo?
- Si Celo es una red de bajo costo, ¿tiene algo similar a Arbitrum como **zero-knowledge proofs** o **rollups** para escalar aún más?
- ¿Qué pasaría si las transacciones fueran más baratas? ¿Qué casos de uso podríamos desbloquear?
- ¿Se pueden usar otros lenguajes como **Rust** para programar en Celo, o Solidity es la única opción?
- ¿Cómo funciona el sistema de Celo por debajo? ¿Se pueden implementar cosas más avanzadas como en otras redes?
- ¿Sería posible combinar Celo con otras redes como Arbitrum usando algo como **CCOP** (Cross-Chain Oracle Protocol)? ¿O eso sería una sobreingeniería?

---

## 💡 Aplicaciones que imagino

El contrato `VaultLock` permite bloquear fondos hasta que se cumpla una condición de tiempo, y luego transferirlos. Me parece útil para:

- Pagos programados
- Acuerdos entre partes
- Freelancers que reciben fondos al completar una tarea
- Automatización de flujos financieros

Me gustaría explorar si algo así se puede implementar en otras redes como Arbitrum, o incluso combinar con Celo para aprovechar lo mejor de cada ecosistema.

---

## 🖥️ Experiencia integrando la UI

Al llevar este contrato a una interfaz web me encontré con varios retos y aprendizajes:

- La principal dificultad fue entender cómo un cliente (frontend) se comunica con el contrato inteligente. Al inicio traté de usar funciones que ya no eran compatibles (`simulateContract` vs `walletClient.writeContract`), lo que me llevó a errores que parecían más complejos de lo que realmente eran.
- Me di cuenta de la importancia de estar actualizado con las librerías y herramientas. Una parte del problema era que estaba siguiendo ejemplos antiguos que ya no aplicaban.
- También aprendí la diferencia entre trabajar solo con terminal (Foundry, cast) y hacerlo desde el navegador: en la terminal controlas todo directamente, mientras que en la UI hay que manejar la firma de transacciones, permisos de la wallet y errores de conexión.
- Hubo un punto clave: la gestión de la private key. Al inicio no estaba claro cómo integrarla para las pruebas, pero luego entendí que la UI no debe manejar directamente las keys sino delegar todo a la wallet del usuario.
- Una conclusión importante: **el “cliente” no es solo la persona que usa la app, también es el software (frontend) que actúa como puente entre el usuario y la blockchain**. Ese cambio de mentalidad me ayudó a resolver los bloqueos.

En resumen, esta parte del ejercicio no solo me enseñó a conectar el contrato con una interfaz, sino también a pensar en cómo se diseña la experiencia completa para el usuario, no solo el código del contrato.

---

## 🌐 Comunidad y recursos

Conocí a personas interesantes del ecosistema, comentarios de clase del profesor, y aprendí del trabajo de gente como:

- [Levelsio (Pieter Levels)](https://twitter.com/levelsio)
- [Mauricio Loeva](https://x.com/buildinpublic) ← _investigaré su perfil de twitter no me acuerdo_
- Comunidad [Celo Colombia](https://x.com/i/communities/1493446837214187523)

Este trabajo se basa en el ejercicio del bootcamp de Celo Colombia:  
[Guía oficial del ejercicio](https://github.com/cold-briu/celo-colombia-bootcamp/tree/main/bootcamp/guides/02.session)

## 📚 Anterior clase

- [Clase 1 – Hello Celo](../../tree/01hello-celo)

## 📚 Siguientes clases

- [Clase 3 – cCOP Multisig Wallet](../../tree/03ccop-multisig)
- [Clase 4 – Uniswap LP Dashboard](../../tree/04lp-dashboard)
