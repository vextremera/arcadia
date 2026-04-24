export const SUPPORTED_LANGS = ["es", "ca", "en", "fr"] as const;
export type SiteLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SiteLang = "es";

export function isSiteLang(value: string | null | undefined): value is SiteLang {
    return SUPPORTED_LANGS.includes((value ?? "") as SiteLang);
}

export function resolveSiteLang(value: string | null | undefined): SiteLang {
    return isSiteLang(value) ? value : DEFAULT_LANG;
}

type FAQItem = { q: string; a: string };
type FAQSection = { title: string; items: FAQItem[] };
type RichSection = { title: string; body: string[] };

type SiteCopy = {
    footer: {
        brandBlurb: string[];
        contactTitle: string;
        linksTitle: string;
        supportTitle: string;
        languageTitle: string;
        links: {
            about: string;
            order: string;
            hours: string;
            location: string;
            faq: string;
            contact: string;
            legal: string;
            privacy: string;
        };
    };
    header: {
        nav: {
            about: string;
            hours: string;
            location: string;
            menuLetter: string;
            menuDay: string;
            delivery: string;
        };
        aria: {
            mainNav: string;
            mobileNav: string;
            openMenu: string;
            account: string;
        };
    };
    faq: {
        title: string;
        intro: string;
        sections: FAQSection[];
    };
    contact: {
        title: string;
        intro: string;
        cards: {
            phone: string;
            email: string;
            address: string;
            hours: string;
        };
        form: {
            title: string;
            name: string;
            email: string;
            subject: string;
            message: string;
            submit: string;
            success: string;
            error: string;
        };
    };
    legal: {
        title: string;
        intro: string;
        sections: RichSection[];
    };
    privacy: {
        title: string;
        intro: string;
        sections: RichSection[];
    };
};

export const siteCopy: Record<SiteLang, SiteCopy> = {
    es: {
        footer: {
            brandBlurb: [
                "Bar restaurante en Lloret de Mar.",
                "Tapas, bocatas, hamburguesas y menús.",
            ],
            contactTitle: "Contacto",
            linksTitle: "Enlaces",
            supportTitle: "Soporte",
            languageTitle: "Idioma",
            links: {
                about: "Sobre nosotros",
                order: "Pedir",
                hours: "Horarios",
                location: "Ubicación",
                faq: "FAQ",
                contact: "Contact us",
                legal: "Legal",
                privacy: "Privacidad",
            },
        },
        header: {
            nav: {
                about: "Sobre Nosotros",
                hours: "Horario",
                location: "Ubicación",
                menuLetter: "Carta",
                menuDay: "Menú",
                delivery: "Domicilio",
            },
            aria: {
                mainNav: "Navegación principal",
                mobileNav: "Navegación móvil",
                openMenu: "Abrir menú",
                account: "Cuenta",
            },
        },
        faq: {
            title: "Preguntas frecuentes",
            intro:
                "Aquí encontrarás respuestas rápidas a las dudas más habituales sobre pedidos, reparto, pagos, personalización, fidelización y atención al cliente.",
            sections: [
                {
                    title: "Pedidos",
                    items: [
                        {
                            q: "¿Cómo hago un pedido?",
                            a: "Puedes acceder desde la sección Pedir, navegar por la carta, personalizar los productos y completar el checkout con tus datos y método de pago.",
                        },
                        {
                            q: "¿Puedo modificar un pedido ya enviado?",
                            a: "Una vez enviado, el pedido entra en flujo operativo. Si necesitas cambiar algo, lo mejor es contactar cuanto antes con el restaurante.",
                        },
                    ],
                },
                {
                    title: "Reparto y recogida",
                    items: [
                        {
                            q: "¿Puedo pedir para recoger en local?",
                            a: "Sí. Durante el checkout puedes elegir entre recogida o reparto, según disponibilidad y operativa activa en ese momento.",
                        },
                        {
                            q: "¿Siempre hay reparto disponible?",
                            a: "No necesariamente. El sistema valida horarios, zonas y reglas operativas antes de confirmar la comanda.",
                        },
                    ],
                },
                {
                    title: "Pagos",
                    items: [
                        {
                            q: "¿Qué métodos de pago están disponibles?",
                            a: "La web contempla pago en efectivo y flujo de tarjeta. La disponibilidad exacta depende de la configuración activa del negocio.",
                        },
                        {
                            q: "¿El pago online es inmediato?",
                            a: "Cuando el flujo de tarjeta está activo, el pedido pasa por el circuito de pago configurado antes de volver al ticket final.",
                        },
                    ],
                },
                {
                    title: "Personalización de productos",
                    items: [
                        {
                            q: "¿Puedo quitar ingredientes?",
                            a: "Sí. Muchos productos permiten retirar ingredientes por defecto durante el configurador.",
                        },
                        {
                            q: "¿Puedo añadir extras o ingredientes?",
                            a: "Sí. Según el producto y la categoría, puedes añadir ingredientes comunes y extras como salsas o modificadores configurados.",
                        },
                    ],
                },
                {
                    title: "Alérgenos y disponibilidad",
                    items: [
                        {
                            q: "¿Dónde veo los alérgenos?",
                            a: "Cada producto muestra su información relevante de alérgenos cuando está configurada en el catálogo.",
                        },
                        {
                            q: "¿Se garantiza disponibilidad de todos los cambios?",
                            a: "Intentamos reflejar la configuración real, pero algunos cambios o peticiones pueden depender de stock y operativa del momento.",
                        },
                    ],
                },
                {
                    title: "Cuenta y loyalty",
                    items: [
                        {
                            q: "¿Para qué sirve mi cuenta?",
                            a: "Tu cuenta permite guardar pedidos, direcciones, historial y progreso de fidelización cuando esa funcionalidad está activa.",
                        },
                        {
                            q: "¿Cómo funcionan los puntos?",
                            a: "Los puntos se asignan al crear la comanda y pueden ajustarse si el pedido se cancela o se revierte.",
                        },
                    ],
                },
                {
                    title: "Soporte e incidencias",
                    items: [
                        {
                            q: "¿Qué hago si hay un problema con mi pedido?",
                            a: "Te recomendamos contactar directamente con el restaurante lo antes posible mediante teléfono o correo.",
                        },
                        {
                            q: "¿Dónde puedo enviar una consulta general?",
                            a: "Puedes usar la página de Contact us para hacernos llegar dudas, incidencias o consultas comerciales.",
                        },
                    ],
                },
            ],
        },
        contact: {
            title: "Contact us",
            intro:
                "Si tienes una duda, una incidencia o simplemente quieres escribirnos, puedes usar este formulario o contactar por los canales habituales.",
            cards: {
                phone: "Teléfono",
                email: "Correo electrónico",
                address: "Dirección",
                hours: "Atención",
            },
            form: {
                title: "Envíanos un mensaje",
                name: "Nombre",
                email: "Email",
                subject: "Asunto",
                message: "Mensaje",
                submit: "Enviar mensaje",
                success: "Tu mensaje se ha enviado correctamente.",
                error: "No se pudo enviar el mensaje. Revisa los datos o inténtalo más tarde.",
            },
        },
        legal: {
            title: "Aviso legal",
            intro:
                "Este apartado recoge la información general del sitio web, sus condiciones básicas de uso y las responsabilidades asociadas al acceso y navegación.",
            sections: [
                {
                    title: "Titular del sitio",
                    body: [
                        "La web de ARCADIA actúa como soporte informativo, comercial y operativo del bar-restaurante. La identificación definitiva del titular y los datos fiscales deberán completarse con la información legal del negocio.",
                    ],
                },
                {
                    title: "Condiciones de uso",
                    body: [
                        "El acceso a la web implica la aceptación de un uso adecuado de los contenidos, servicios y funcionalidades disponibles.",
                        "Queda prohibido el uso del sitio con fines ilícitos, fraudulentos o que puedan perjudicar el funcionamiento del servicio o la experiencia de otros usuarios.",
                    ],
                },
                {
                    title: "Propiedad intelectual",
                    body: [
                        "Los textos, imágenes, diseños, marcas, logotipos y demás elementos del sitio forman parte de la identidad y contenidos del proyecto y no pueden reutilizarse sin autorización.",
                    ],
                },
                {
                    title: "Funcionamiento del servicio",
                    body: [
                        "ARCADIA puede actualizar precios, productos, horarios, operativa, disponibilidad y condiciones de servicio sin necesidad de preaviso, siempre dentro del marco normal de gestión del restaurante.",
                    ],
                },
                {
                    title: "Responsabilidad",
                    body: [
                        "Se realizará el máximo esfuerzo para mantener la web actualizada y operativa, pero no se garantiza la ausencia absoluta de errores, indisponibilidades temporales o incidencias externas.",
                    ],
                },
            ],
        },
        privacy: {
            title: "Política de privacidad",
            intro:
                "En esta sección se describe cómo se tratan los datos personales recogidos a través de la web y con qué finalidad se utilizan.",
            sections: [
                {
                    title: "Responsable del tratamiento",
                    body: [
                        "El responsable del tratamiento será el titular del negocio asociado a ARCADIA. Los datos identificativos definitivos deberán incorporarse con la información legal real del restaurante.",
                    ],
                },
                {
                    title: "Datos que se recogen",
                    body: [
                        "La web puede recoger datos como nombre, email, teléfono, direcciones, datos de cuenta, información de pedidos y mensajes enviados mediante formularios.",
                    ],
                },
                {
                    title: "Finalidad del tratamiento",
                    body: [
                        "Los datos se utilizan para gestionar pedidos, cuentas de usuario, comunicaciones, soporte, envíos informativos, fidelización y mejora del servicio.",
                    ],
                },
                {
                    title: "Conservación y cesiones",
                    body: [
                        "Los datos se conservarán durante el tiempo necesario para prestar el servicio, cumplir obligaciones legales o mantener el historial funcional del usuario.",
                        "No se realizarán cesiones fuera de las necesarias para la operativa técnica o legal del servicio.",
                    ],
                },
                {
                    title: "Derechos del usuario",
                    body: [
                        "El usuario puede solicitar acceso, rectificación, supresión, oposición, limitación o portabilidad de sus datos, utilizando los canales de contacto del negocio.",
                    ],
                },
            ],
        },
    },

    ca: {
        footer: {
            brandBlurb: [
                "Bar restaurant a Lloret de Mar.",
                "Tapes, entrepans, hamburgueses i menús.",
            ],
            contactTitle: "Contacte",
            linksTitle: "Enllaços",
            supportTitle: "Suport",
            languageTitle: "Idioma",
            links: {
                about: "Sobre nosaltres",
                order: "Demanar",
                hours: "Horaris",
                location: "Ubicació",
                faq: "FAQ",
                contact: "Contact us",
                legal: "Legal",
                privacy: "Privacitat",
            },
        },
        header: {
            nav: {
                about: "Sobre Nosaltres",
                hours: "Horari",
                location: "Ubicació",
                menuLetter: "Carta",
                menuDay: "Menú",
                delivery: "Domicili",
            },
            aria: {
                mainNav: "Navegació principal",
                mobileNav: "Navegació mòbil",
                openMenu: "Obrir menú",
                account: "Compte",
            },
        },
        faq: {
            title: "Preguntes freqüents",
            intro:
                "Aquí trobaràs respostes ràpides als dubtes més habituals sobre comandes, repartiment, pagaments, personalització, fidelització i suport al client.",
            sections: [
                {
                    title: "Comandes",
                    items: [
                        {
                            q: "Com puc fer una comanda?",
                            a: "Pots accedir des de la secció Demanar, navegar per la carta, personalitzar els productes i completar el checkout amb les teves dades i mètode de pagament.",
                        },
                        {
                            q: "Puc modificar una comanda ja enviada?",
                            a: "Un cop enviada, la comanda entra en el flux operatiu. Si necessites canviar alguna cosa, el millor és contactar amb el restaurant tan aviat com sigui possible.",
                        },
                    ],
                },
                {
                    title: "Repartiment i recollida",
                    items: [
                        {
                            q: "Puc demanar per recollir al local?",
                            a: "Sí. Durant el checkout pots escollir entre recollida o repartiment, segons la disponibilitat i l’operativa activa en aquell moment.",
                        },
                        {
                            q: "Sempre hi ha repartiment disponible?",
                            a: "No necessàriament. El sistema valida horaris, zones i regles operatives abans de confirmar la comanda.",
                        },
                    ],
                },
                {
                    title: "Pagaments",
                    items: [
                        {
                            q: "Quins mètodes de pagament hi ha disponibles?",
                            a: "La web contempla pagament en efectiu i flux amb targeta. La disponibilitat exacta depèn de la configuració activa del negoci.",
                        },
                        {
                            q: "El pagament online és immediat?",
                            a: "Quan el flux de targeta està actiu, la comanda passa pel circuit de pagament configurat abans de tornar al tiquet final.",
                        },
                    ],
                },
                {
                    title: "Personalització de productes",
                    items: [
                        {
                            q: "Puc treure ingredients?",
                            a: "Sí. Molts productes permeten retirar ingredients per defecte durant el configurador.",
                        },
                        {
                            q: "Puc afegir extres o ingredients?",
                            a: "Sí. Segons el producte i la categoria, pots afegir ingredients comuns i extres com salses o modificadors configurats.",
                        },
                    ],
                },
                {
                    title: "Al·lèrgens i disponibilitat",
                    items: [
                        {
                            q: "On puc veure els al·lèrgens?",
                            a: "Cada producte mostra la informació rellevant d’al·lèrgens quan està configurada al catàleg.",
                        },
                        {
                            q: "Es garanteix la disponibilitat de tots els canvis?",
                            a: "Intentem reflectir la configuració real, però alguns canvis o peticions poden dependre de l’estoc i de l’operativa del moment.",
                        },
                    ],
                },
                {
                    title: "Compte i loyalty",
                    items: [
                        {
                            q: "Per a què serveix el meu compte?",
                            a: "El teu compte permet guardar comandes, adreces, historial i progrés de fidelització quan aquesta funcionalitat està activa.",
                        },
                        {
                            q: "Com funcionen els punts?",
                            a: "Els punts s’assignen en crear la comanda i es poden ajustar si la comanda es cancel·la o es reverteix.",
                        },
                    ],
                },
                {
                    title: "Suport i incidències",
                    items: [
                        {
                            q: "Què faig si hi ha un problema amb la meva comanda?",
                            a: "Et recomanem contactar directament amb el restaurant tan aviat com sigui possible mitjançant telèfon o correu.",
                        },
                        {
                            q: "On puc enviar una consulta general?",
                            a: "Pots fer servir la pàgina de Contact us per enviar-nos dubtes, incidències o consultes comercials.",
                        },
                    ],
                },
            ],
        },
        contact: {
            title: "Contact us",
            intro:
                "Si tens un dubte, una incidència o simplement vols escriure’ns, pots utilitzar aquest formulari o contactar pels canals habituals.",
            cards: {
                phone: "Telèfon",
                email: "Correu electrònic",
                address: "Adreça",
                hours: "Atenció",
            },
            form: {
                title: "Envia’ns un missatge",
                name: "Nom",
                email: "Email",
                subject: "Assumpte",
                message: "Missatge",
                submit: "Enviar missatge",
                success: "El teu missatge s’ha enviat correctament.",
                error: "No s’ha pogut enviar el missatge. Revisa les dades o torna-ho a provar més tard.",
            },
        },
        legal: {
            title: "Avís legal",
            intro:
                "Aquest apartat recull la informació general del lloc web, les seves condicions bàsiques d’ús i les responsabilitats associades a l’accés i navegació.",
            sections: [
                {
                    title: "Titular del lloc",
                    body: [
                        "La web d’ARCADIA actua com a suport informatiu, comercial i operatiu del bar-restaurant. La identificació definitiva del titular i les dades fiscals s’hauran de completar amb la informació legal del negoci.",
                    ],
                },
                {
                    title: "Condicions d’ús",
                    body: [
                        "L’accés a la web implica l’acceptació d’un ús adequat dels continguts, serveis i funcionalitats disponibles.",
                        "Queda prohibit l’ús del lloc amb finalitats il·lícites, fraudulentes o que puguin perjudicar el funcionament del servei o l’experiència d’altres usuaris.",
                    ],
                },
                {
                    title: "Propietat intel·lectual",
                    body: [
                        "Els textos, imatges, dissenys, marques, logotips i altres elements del lloc formen part de la identitat i continguts del projecte i no poden reutilitzar-se sense autorització.",
                    ],
                },
                {
                    title: "Funcionament del servei",
                    body: [
                        "ARCADIA pot actualitzar preus, productes, horaris, operativa, disponibilitat i condicions de servei sense necessitat d’avís previ, sempre dins del marc normal de gestió del restaurant.",
                    ],
                },
                {
                    title: "Responsabilitat",
                    body: [
                        "Es farà el màxim esforç per mantenir la web actualitzada i operativa, però no es garanteix l’absència absoluta d’errors, indisponibilitats temporals o incidències externes.",
                    ],
                },
            ],
        },
        privacy: {
            title: "Política de privacitat",
            intro:
                "En aquesta secció es descriu com es tracten les dades personals recollides a través de la web i amb quina finalitat s’utilitzen.",
            sections: [
                {
                    title: "Responsable del tractament",
                    body: [
                        "El responsable del tractament serà el titular del negoci associat a ARCADIA. Les dades identificatives definitives s’hauran d’incorporar amb la informació legal real del restaurant.",
                    ],
                },
                {
                    title: "Dades que es recullen",
                    body: [
                        "La web pot recollir dades com nom, email, telèfon, adreces, dades de compte, informació de comandes i missatges enviats mitjançant formularis.",
                    ],
                },
                {
                    title: "Finalitat del tractament",
                    body: [
                        "Les dades s’utilitzen per gestionar comandes, comptes d’usuari, comunicacions, suport, enviaments informatius, fidelització i millora del servei.",
                    ],
                },
                {
                    title: "Conservació i cessions",
                    body: [
                        "Les dades es conservaran durant el temps necessari per prestar el servei, complir obligacions legals o mantenir l’historial funcional de l’usuari.",
                        "No es faran cessions fora de les necessàries per a l’operativa tècnica o legal del servei.",
                    ],
                },
                {
                    title: "Drets de l’usuari",
                    body: [
                        "L’usuari pot sol·licitar accés, rectificació, supressió, oposició, limitació o portabilitat de les seves dades utilitzant els canals de contacte del negoci.",
                    ],
                },
            ],
        },
    },

    en: {
        footer: {
            brandBlurb: [
                "Restaurant bar in Lloret de Mar.",
                "Tapas, sandwiches, burgers and daily menus.",
            ],
            contactTitle: "Contact",
            linksTitle: "Links",
            supportTitle: "Support",
            languageTitle: "Language",
            links: {
                about: "About us",
                order: "Order",
                hours: "Opening hours",
                location: "Location",
                faq: "FAQ",
                contact: "Contact us",
                legal: "Legal",
                privacy: "Privacy",
            },
        },
        header: {
            nav: {
                about: "About Us",
                hours: "Hours",
                location: "Location",
                menuLetter: "Menu",
                menuDay: "Daily Menu",
                delivery: "Delivery",
            },
            aria: {
                mainNav: "Main navigation",
                mobileNav: "Mobile navigation",
                openMenu: "Open menu",
                account: "Account",
            },
        },
        faq: {
            title: "Frequently asked questions",
            intro:
                "Here you will find quick answers to the most common questions about ordering, delivery, payments, product customisation, loyalty and customer support.",
            sections: [
                {
                    title: "Orders",
                    items: [
                        {
                            q: "How do I place an order?",
                            a: "You can enter through the Order section, browse the menu, customise products and complete checkout with your details and payment method.",
                        },
                        {
                            q: "Can I change an order after sending it?",
                            a: "Once submitted, the order enters the operational flow. If you need to change something, the best option is to contact the restaurant as soon as possible.",
                        },
                    ],
                },
                {
                    title: "Delivery and pickup",
                    items: [
                        {
                            q: "Can I order for pickup?",
                            a: "Yes. During checkout you can choose pickup or delivery depending on availability and the active operational rules.",
                        },
                        {
                            q: "Is delivery always available?",
                            a: "Not always. The system validates hours, zones and operational rules before confirming the order.",
                        },
                    ],
                },
                {
                    title: "Payments",
                    items: [
                        {
                            q: "Which payment methods are available?",
                            a: "The website supports cash and card flows. Exact availability depends on the current business configuration.",
                        },
                        {
                            q: "Is online payment immediate?",
                            a: "When the card flow is active, the order goes through the configured payment circuit before returning to the final ticket.",
                        },
                    ],
                },
                {
                    title: "Product customisation",
                    items: [
                        {
                            q: "Can I remove ingredients?",
                            a: "Yes. Many products allow default ingredients to be removed in the configurator.",
                        },
                        {
                            q: "Can I add extras or ingredients?",
                            a: "Yes. Depending on the product and category, you can add common ingredients and extras such as sauces or configured modifiers.",
                        },
                    ],
                },
                {
                    title: "Allergens and availability",
                    items: [
                        {
                            q: "Where can I see allergens?",
                            a: "Each product displays relevant allergen information whenever it has been configured in the catalogue.",
                        },
                        {
                            q: "Are all requested changes guaranteed?",
                            a: "We try to reflect real configuration, but some requests may depend on stock and current operations.",
                        },
                    ],
                },
                {
                    title: "Account and loyalty",
                    items: [
                        {
                            q: "What is my account for?",
                            a: "Your account lets you store orders, addresses, history and loyalty progress when those features are active.",
                        },
                        {
                            q: "How do points work?",
                            a: "Points are assigned when the order is created and may be adjusted if the order is cancelled or reversed.",
                        },
                    ],
                },
                {
                    title: "Support and incidents",
                    items: [
                        {
                            q: "What should I do if there is a problem with my order?",
                            a: "We recommend contacting the restaurant directly as soon as possible by phone or email.",
                        },
                        {
                            q: "Where can I send a general question?",
                            a: "You can use the Contact us page to send questions, incidents or business enquiries.",
                        },
                    ],
                },
            ],
        },
        contact: {
            title: "Contact us",
            intro:
                "If you have a question, an issue or simply want to reach out, you can use this form or contact us through the usual channels.",
            cards: {
                phone: "Phone",
                email: "Email",
                address: "Address",
                hours: "Support",
            },
            form: {
                title: "Send us a message",
                name: "Name",
                email: "Email",
                subject: "Subject",
                message: "Message",
                submit: "Send message",
                success: "Your message was sent successfully.",
                error: "The message could not be sent. Please check the information or try again later.",
            },
        },
        legal: {
            title: "Legal notice",
            intro:
                "This section contains the general information of the website, its basic terms of use and the responsibilities linked to access and navigation.",
            sections: [
                {
                    title: "Site owner",
                    body: [
                        "The ARCADIA website acts as the informational, commercial and operational support of the restaurant. The definitive legal identity and tax details must be completed with the real business information.",
                    ],
                },
                {
                    title: "Terms of use",
                    body: [
                        "Access to the website implies acceptance of proper use of the available content, services and functions.",
                        "Use of the site for unlawful, fraudulent or harmful purposes is prohibited.",
                    ],
                },
                {
                    title: "Intellectual property",
                    body: [
                        "Texts, images, designs, trademarks, logos and other elements of the site are part of the project identity and may not be reused without permission.",
                    ],
                },
                {
                    title: "Service operation",
                    body: [
                        "ARCADIA may update prices, products, opening hours, operations, availability and service conditions without prior notice, as part of normal restaurant management.",
                    ],
                },
                {
                    title: "Liability",
                    body: [
                        "Every effort will be made to keep the website updated and available, but the complete absence of errors, temporary outages or third-party incidents cannot be guaranteed.",
                    ],
                },
            ],
        },
        privacy: {
            title: "Privacy policy",
            intro:
                "This section explains how personal data collected through the website is processed and for which purposes it is used.",
            sections: [
                {
                    title: "Data controller",
                    body: [
                        "The data controller will be the business owner associated with ARCADIA. Final identification details must be completed with the real legal information of the restaurant.",
                    ],
                },
                {
                    title: "Data collected",
                    body: [
                        "The website may collect data such as name, email, phone number, addresses, account data, order information and messages sent through forms.",
                    ],
                },
                {
                    title: "Purpose of processing",
                    body: [
                        "Data is used to manage orders, user accounts, communications, support, newsletters, loyalty features and service improvement.",
                    ],
                },
                {
                    title: "Retention and disclosure",
                    body: [
                        "Data will be kept for as long as necessary to provide the service, comply with legal obligations or preserve the user's functional history.",
                        "No disclosure will be made beyond what is required for the technical or legal operation of the service.",
                    ],
                },
                {
                    title: "User rights",
                    body: [
                        "Users may request access, rectification, erasure, objection, restriction or portability of their data through the business contact channels.",
                    ],
                },
            ],
        },
    },

    fr: {
        footer: {
            brandBlurb: [
                "Bar restaurant à Lloret de Mar.",
                "Tapas, sandwiches, hamburgers et menus.",
            ],
            contactTitle: "Contact",
            linksTitle: "Liens",
            supportTitle: "Support",
            languageTitle: "Langue",
            links: {
                about: "À propos",
                order: "Commander",
                hours: "Horaires",
                location: "Emplacement",
                faq: "FAQ",
                contact: "Contact us",
                legal: "Mentions légales",
                privacy: "Confidentialité",
            },
        },
        header: {
            nav: {
                about: "À propos",
                hours: "Horaires",
                location: "Emplacement",
                menuLetter: "Carte",
                menuDay: "Menu",
                delivery: "Livraison",
            },
            aria: {
                mainNav: "Navigation principale",
                mobileNav: "Navigation mobile",
                openMenu: "Ouvrir le menu",
                account: "Compte",
            },
        },
        faq: {
            title: "Questions fréquentes",
            intro:
                "Vous trouverez ici des réponses rapides aux questions les plus courantes sur les commandes, la livraison, les paiements, la personnalisation des produits, la fidélisation et l’assistance client.",
            sections: [
                {
                    title: "Commandes",
                    items: [
                        {
                            q: "Comment passer une commande ?",
                            a: "Vous pouvez accéder à la section Commander, parcourir la carte, personnaliser les produits et finaliser le checkout avec vos données et votre mode de paiement.",
                        },
                        {
                            q: "Puis-je modifier une commande déjà envoyée ?",
                            a: "Une fois envoyée, la commande entre dans le flux opérationnel. Si vous devez modifier quelque chose, le mieux est de contacter rapidement le restaurant.",
                        },
                    ],
                },
                {
                    title: "Livraison et retrait",
                    items: [
                        {
                            q: "Puis-je commander pour retrait sur place ?",
                            a: "Oui. Pendant le checkout, vous pouvez choisir entre retrait et livraison selon la disponibilité et l’opérative active.",
                        },
                        {
                            q: "La livraison est-elle toujours disponible ?",
                            a: "Pas forcément. Le système valide les horaires, les zones et les règles opérationnelles avant de confirmer la commande.",
                        },
                    ],
                },
                {
                    title: "Paiements",
                    items: [
                        {
                            q: "Quels moyens de paiement sont disponibles ?",
                            a: "Le site prévoit le paiement en espèces et le flux carte. La disponibilité exacte dépend de la configuration active du restaurant.",
                        },
                        {
                            q: "Le paiement en ligne est-il immédiat ?",
                            a: "Lorsque le flux carte est actif, la commande passe par le circuit de paiement configuré avant de revenir au ticket final.",
                        },
                    ],
                },
                {
                    title: "Personnalisation des produits",
                    items: [
                        {
                            q: "Puis-je retirer des ingrédients ?",
                            a: "Oui. Beaucoup de produits permettent de retirer les ingrédients par défaut dans le configurateur.",
                        },
                        {
                            q: "Puis-je ajouter des extras ou des ingrédients ?",
                            a: "Oui. Selon le produit et la catégorie, vous pouvez ajouter des ingrédients communs et des extras comme les sauces ou les modificateurs configurés.",
                        },
                    ],
                },
                {
                    title: "Allergènes et disponibilité",
                    items: [
                        {
                            q: "Où puis-je voir les allergènes ?",
                            a: "Chaque produit affiche les informations pertinentes sur les allergènes lorsqu’elles sont configurées dans le catalogue.",
                        },
                        {
                            q: "Tous les changements demandés sont-ils garantis ?",
                            a: "Nous essayons de refléter la configuration réelle, mais certaines demandes peuvent dépendre du stock et de l’opérative du moment.",
                        },
                    ],
                },
                {
                    title: "Compte et fidélité",
                    items: [
                        {
                            q: "À quoi sert mon compte ?",
                            a: "Votre compte permet de conserver commandes, adresses, historique et progression de fidélité lorsque ces fonctions sont actives.",
                        },
                        {
                            q: "Comment fonctionnent les points ?",
                            a: "Les points sont attribués lors de la création de la commande et peuvent être ajustés si la commande est annulée ou inversée.",
                        },
                    ],
                },
                {
                    title: "Support et incidents",
                    items: [
                        {
                            q: "Que faire s’il y a un problème avec ma commande ?",
                            a: "Nous vous recommandons de contacter directement le restaurant dès que possible par téléphone ou par email.",
                        },
                        {
                            q: "Où puis-je envoyer une question générale ?",
                            a: "Vous pouvez utiliser la page Contact us pour nous envoyer des questions, incidents ou demandes commerciales.",
                        },
                    ],
                },
            ],
        },
        contact: {
            title: "Contact us",
            intro:
                "Si vous avez une question, un incident ou souhaitez simplement nous écrire, vous pouvez utiliser ce formulaire ou nous contacter via les canaux habituels.",
            cards: {
                phone: "Téléphone",
                email: "Email",
                address: "Adresse",
                hours: "Support",
            },
            form: {
                title: "Envoyez-nous un message",
                name: "Nom",
                email: "Email",
                subject: "Sujet",
                message: "Message",
                submit: "Envoyer le message",
                success: "Votre message a été envoyé correctement.",
                error: "Le message n’a pas pu être envoyé. Vérifiez les données ou réessayez plus tard.",
            },
        },
        legal: {
            title: "Mentions légales",
            intro:
                "Cette section présente les informations générales du site, ses conditions d’utilisation de base et les responsabilités associées à l’accès et à la navigation.",
            sections: [
                {
                    title: "Propriétaire du site",
                    body: [
                        "Le site ARCADIA sert de support informatif, commercial et opérationnel du restaurant. L’identité légale définitive et les données fiscales devront être complétées avec les informations réelles de l’entreprise.",
                    ],
                },
                {
                    title: "Conditions d’utilisation",
                    body: [
                        "L’accès au site implique l’acceptation d’un usage approprié des contenus, services et fonctionnalités disponibles.",
                        "L’utilisation du site à des fins illicites, frauduleuses ou nuisibles est interdite.",
                    ],
                },
                {
                    title: "Propriété intellectuelle",
                    body: [
                        "Les textes, images, designs, marques, logos et autres éléments du site font partie de l’identité du projet et ne peuvent être réutilisés sans autorisation.",
                    ],
                },
                {
                    title: "Fonctionnement du service",
                    body: [
                        "ARCADIA peut mettre à jour les prix, produits, horaires, fonctionnement, disponibilité et conditions de service sans préavis dans le cadre normal de la gestion du restaurant.",
                    ],
                },
                {
                    title: "Responsabilité",
                    body: [
                        "Tous les efforts seront faits pour maintenir le site opérationnel et à jour, mais l’absence totale d’erreurs, d’indisponibilités temporaires ou d’incidents externes ne peut être garantie.",
                    ],
                },
            ],
        },
        privacy: {
            title: "Politique de confidentialité",
            intro:
                "Cette section explique comment les données personnelles collectées via le site sont traitées et dans quel but elles sont utilisées.",
            sections: [
                {
                    title: "Responsable du traitement",
                    body: [
                        "Le responsable du traitement sera le titulaire du commerce associé à ARCADIA. Les données d’identification définitives devront être complétées avec les informations légales réelles du restaurant.",
                    ],
                },
                {
                    title: "Données collectées",
                    body: [
                        "Le site peut collecter des données telles que le nom, l’email, le téléphone, les adresses, les données de compte, les informations de commande et les messages envoyés via des formulaires.",
                    ],
                },
                {
                    title: "Finalité du traitement",
                    body: [
                        "Les données sont utilisées pour gérer les commandes, les comptes utilisateurs, les communications, le support, les envois d’information, la fidélisation et l’amélioration du service.",
                    ],
                },
                {
                    title: "Conservation et communication",
                    body: [
                        "Les données seront conservées pendant le temps nécessaire pour fournir le service, respecter les obligations légales ou conserver l’historique fonctionnel de l’utilisateur.",
                        "Aucune communication ne sera effectuée au-delà de ce qui est nécessaire au fonctionnement technique ou légal du service.",
                    ],
                },
                {
                    title: "Droits de l’utilisateur",
                    body: [
                        "L’utilisateur peut demander l’accès, la rectification, l’effacement, l’opposition, la limitation ou la portabilité de ses données via les canaux de contact du commerce.",
                    ],
                },
            ],
        },
    },
};

export function getSiteCopy(lang: SiteLang) {
    return siteCopy[lang] ?? siteCopy[DEFAULT_LANG];
}