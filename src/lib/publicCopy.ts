import { DEFAULT_LANG, type SiteLang } from "@/lib/i18n";

type PublicAvailabilityLike = {
    pauseOrders?: boolean;
    forcePickup?: boolean;
    sourceNotes?: {
        delivery?: string | null;
    };
    specialDateNotes?: Array<{
        channel?: string | null;
        note?: string | null;
    }>;
};

type PublicCopy = {
    common: {
        days: Record<string, string>;
        closed: string;
        pickup: string;
        delivery: string;
        local: string;
        channel: string;
    };
    home: {
        hero: {
            subtitle: string;
        };
        about: {
            title: string;
            quote: string;
            body: string[];
        };
        hours: {
            title: string;
            subtitle: string;
            localLabel: string;
            deliveryLabel: string;
            reserve: string;
            orderNow: string;
            open: string;
            closed: string;
            available: string;
            unavailable: string;
            pickupOnly: string;
            pauseOrdersMessage: string;
            forcePickupMessageBase: string;
            specialNotePrefix: string;
        };
        location: {
            title: string;
            phone: string;
            email: string;
            instagram: string;
        };
        newsletter: {
            title: string;
            subtitle: string;
        };
        reviews: {
            title: string;
            reviewsLabel: string;
        };
        tiles: {
            delivery: {
                title: string;
                body: string;
            };
            carta: {
                title: string;
                body: string;
            };
            menu: {
                title: string;
                body: string;
            };
        };
    };
    pages: {
        menu: {
            title: string;
            heroTitle: string;
            heroSubtitle: string;
        };
        carta: {
            title: string;
            heroTitle: string;
            heroSubtitle: string;
            backToTop: string;
            noProducts: string;
        };
        checkout: {
            title: string;
            pausedTitle: string;
            pausedBody: string;
            specialTitle: string;
            specialHeading: string;
            specialBody: string;
            local: string;
            pickup: string;
            delivery: string;
            open: string;
            closed: string;
            available: string;
            unavailable: string;
            pickupOnly: string;
            sourceSpecial: string;
            sourceSpecialClosed: string;
            sourceWeekly: string;
            sourceWeeklyClosed: string;
            sourceBase: string;
            forcePickupNote: string;
        };
        pedir: {
            title: string;
        };
    };
};

const publicCopy: Record<SiteLang, PublicCopy> = {
    es: {
        common: {
            days: {
                Lunes: "Lunes",
                Martes: "Martes",
                Miércoles: "Miércoles",
                Jueves: "Jueves",
                Viernes: "Viernes",
                Sábado: "Sábado",
                Domingo: "Domingo",
            },
            closed: "Descanso",
            pickup: "Recogida",
            delivery: "Delivery",
            local: "Local",
            channel: "Canal",
        },
        home: {
            hero: {
                subtitle: "BAR RESTAURANTE",
            },
            about: {
                title: "SOBRE NOSOTROS",
                quote: "“La comida casera como en casa”",
                body: [
                    "En el Bar Restaurante Arcadia encontrarás comida casera y auténtica, como la de antes, elaborada con tiempo, maestría y cariño. Productos de calidad y buen servicio.",
                    "Una cocina nacida de la tradición popular y la vida cotidiana, la que se cocinaba en casa y que hoy sigue viva en las cocinas de Arcadia, adaptada a los gustos actuales pero sin perder su esencia. Platos familiares y generosos, pensados tanto para comer en el local como para disfrutar en casa, gracias a nuestro servicio de entrega a domicilio.",
                ],
            },
            hours: {
                title: "HORARIOS",
                subtitle: "- Organízate sin dudas -",
                localLabel: "LOCAL",
                deliveryLabel: "A DOMICILIO",
                reserve: "Reservar mesa",
                orderNow: "Pedir ahora",
                open: "Abierto",
                closed: "Cerrado",
                available: "Disponible",
                unavailable: "No disponible",
                pickupOnly: "Solo recogida",
                pauseOrdersMessage:
                    "Los pedidos están pausados temporalmente desde operativa. Puedes consultar horarios, pero el canal de pedidos puede no estar disponible en este momento.",
                forcePickupMessageBase:
                    "Ahora mismo trabajamos solo recogida. El reparto está temporalmente desactivado desde operativa.",
                specialNotePrefix: "",
            },
            location: {
                title: "UBICACIÓN",
                phone: "Teléfono:",
                email: "Correo:",
                instagram: "Instagram:",
            },
            newsletter: {
                title: "¿TE APETECE ARCADIA HOY?",
                subtitle: "Regístrate a nuestras ofertas y novedades",
            },
            reviews: {
                title: "RESEÑAS",
                reviewsLabel: "valoraciones",
            },
            tiles: {
                delivery: {
                    title: "DOMICILIO",
                    body: "Haz tu pedido para recibirlo cómodamente donde quieras.",
                },
                carta: {
                    title: "CARTA",
                    body: "Toda la carta disponible para pedir online de forma rápida y clara.",
                },
                menu: {
                    title: "MENÚ",
                    body: "Accede al menú destacado del día con una presentación más directa.",
                },
            },
        },
        pages: {
            menu: {
                title: "Menú",
                heroTitle: "MENÚ",
                heroSubtitle: "Platos especiales seleccionados por nuestro chef.",
            },
            carta: {
                title: "Carta",
                heroTitle: "CARTA",
                heroSubtitle: "Consulta nuestra carta organizada por categorías.",
                backToTop: "↑ arriba",
                noProducts: "No hay productos disponibles.",
            },
            checkout: {
                title: "Finalizar pedido",
                pausedTitle: "Pedidos pausados temporalmente",
                pausedBody:
                    "Ahora mismo no estamos aceptando pedidos. Puedes revisar de nuevo más tarde.",
                specialTitle: "Disponibilidad especial hoy",
                specialHeading: "se está resolviendo con una excepción",
                specialBody:
                    "Hoy la disponibilidad no sale solo del horario base. Alguno de los canales está gobernado por una excepción puntual y por eso puedes ver franjas distintas o cierres temporales.",
                local: "Local",
                pickup: "Pickup",
                delivery: "Delivery",
                open: "Abierto",
                closed: "Cerrado",
                available: "Disponible",
                unavailable: "No disponible",
                pickupOnly: "Solo recogida",
                sourceSpecial: "Excepción activa",
                sourceSpecialClosed: "Excepción de cierre",
                sourceWeekly: "Horario semanal",
                sourceWeeklyClosed: "Descanso semanal",
                sourceBase: "Horario base",
                forcePickupNote:
                    "Ahora mismo trabajamos solo recogida desde operativa, así que aunque hoy exista una franja especial de delivery el checkout seguirá por pickup.",
            },
            pedir: {
                title: "Pedir",
            },
        },
    },

    ca: {
        common: {
            days: {
                Lunes: "Dilluns",
                Martes: "Dimarts",
                Miércoles: "Dimecres",
                Jueves: "Dijous",
                Viernes: "Divendres",
                Sábado: "Dissabte",
                Domingo: "Diumenge",
            },
            closed: "Descans",
            pickup: "Recollida",
            delivery: "Delivery",
            local: "Local",
            channel: "Canal",
        },
        home: {
            hero: {
                subtitle: "BAR RESTAURANT",
            },
            about: {
                title: "SOBRE NOSALTRES",
                quote: "“El menjar casolà com a casa”",
                body: [
                    "Al Bar Restaurant Arcadia hi trobaràs cuina casolana i autèntica, com la d’abans, elaborada amb temps, mestria i estima. Productes de qualitat i bon servei.",
                    "Una cuina nascuda de la tradició popular i de la vida quotidiana, la que es cuinava a casa i que avui continua viva a les cuines d’Arcadia, adaptada als gustos actuals però sense perdre l’essència. Plats familiars i generosos, pensats tant per menjar al local com per gaudir a casa gràcies al nostre servei a domicili.",
                ],
            },
            hours: {
                title: "HORARIS",
                subtitle: "- Organitza’t sense dubtes -",
                localLabel: "LOCAL",
                deliveryLabel: "A DOMICILI",
                reserve: "Reservar taula",
                orderNow: "Demanar ara",
                open: "Obert",
                closed: "Tancat",
                available: "Disponible",
                unavailable: "No disponible",
                pickupOnly: "Només recollida",
                pauseOrdersMessage:
                    "Les comandes estan pausades temporalment des d’operativa. Pots consultar horaris, però el canal de comandes pot no estar disponible en aquest moment.",
                forcePickupMessageBase:
                    "Ara mateix treballem només amb recollida. El repartiment està temporalment desactivat des d’operativa.",
                specialNotePrefix: "",
            },
            location: {
                title: "UBICACIÓ",
                phone: "Telèfon:",
                email: "Correu:",
                instagram: "Instagram:",
            },
            newsletter: {
                title: "ET VE DE GUST ARCADIA AVUI?",
                subtitle: "Registra’t a les nostres ofertes i novetats",
            },
            reviews: {
                title: "RESSENYES",
                reviewsLabel: "ressenyes",
            },
            tiles: {
                delivery: {
                    title: "DOMICILI",
                    body: "Fes la teva comanda per rebre-la còmodament on vulguis.",
                },
                carta: {
                    title: "CARTA",
                    body: "Tota la carta disponible per demanar online de manera ràpida i clara.",
                },
                menu: {
                    title: "MENÚ",
                    body: "Accedeix al menú destacat del dia amb una presentació més directa.",
                },
            },
        },
        pages: {
            menu: {
                title: "Menú",
                heroTitle: "MENÚ",
                heroSubtitle: "Plats especials seleccionats pel nostre xef.",
            },
            carta: {
                title: "Carta",
                heroTitle: "CARTA",
                heroSubtitle: "Consulta la nostra carta organitzada per categories.",
                backToTop: "↑ amunt",
                noProducts: "No hi ha productes disponibles.",
            },
            checkout: {
                title: "Finalitzar comanda",
                pausedTitle: "Comandes pausades temporalment",
                pausedBody:
                    "Ara mateix no estem acceptant comandes. Pots tornar-ho a revisar més tard.",
                specialTitle: "Disponibilitat especial avui",
                specialHeading: "s’està resolent amb una excepció",
                specialBody:
                    "Avui la disponibilitat no surt només de l’horari base. Algun dels canals està governat per una excepció puntual i per això pots veure franges diferents o tancaments temporals.",
                local: "Local",
                pickup: "Recollida",
                delivery: "Delivery",
                open: "Obert",
                closed: "Tancat",
                available: "Disponible",
                unavailable: "No disponible",
                pickupOnly: "Només recollida",
                sourceSpecial: "Excepció activa",
                sourceSpecialClosed: "Excepció de tancament",
                sourceWeekly: "Horari setmanal",
                sourceWeeklyClosed: "Descans setmanal",
                sourceBase: "Horari base",
                forcePickupNote:
                    "Ara mateix treballem només amb recollida des d’operativa, així que encara que avui existeixi una franja especial de delivery el checkout continuarà per recollida.",
            },
            pedir: {
                title: "Demanar",
            },
        },
    },

    en: {
        common: {
            days: {
                Lunes: "Monday",
                Martes: "Tuesday",
                Miércoles: "Wednesday",
                Jueves: "Thursday",
                Viernes: "Friday",
                Sábado: "Saturday",
                Domingo: "Sunday",
            },
            closed: "Closed",
            pickup: "Pickup",
            delivery: "Delivery",
            local: "On site",
            channel: "Channel",
        },
        home: {
            hero: {
                subtitle: "RESTAURANT BAR",
            },
            about: {
                title: "ABOUT US",
                quote: "“Homemade food just like home”",
                body: [
                    "At Bar Restaurante Arcadia you will find authentic homemade food, made the old-fashioned way, with time, care and skill. Quality products and friendly service.",
                    "A cuisine born from everyday tradition, the kind once cooked at home and still alive today in Arcadia’s kitchen, adapted to modern tastes without losing its essence. Generous family-style dishes, designed both for dining in and enjoying at home thanks to our delivery service.",
                ],
            },
            hours: {
                title: "OPENING HOURS",
                subtitle: "- Plan without doubts -",
                localLabel: "ON SITE",
                deliveryLabel: "DELIVERY",
                reserve: "Book a table",
                orderNow: "Order now",
                open: "Open",
                closed: "Closed",
                available: "Available",
                unavailable: "Unavailable",
                pickupOnly: "Pickup only",
                pauseOrdersMessage:
                    "Orders are temporarily paused from operations. You can still check opening hours, but ordering may not be available at this moment.",
                forcePickupMessageBase:
                    "We are currently operating in pickup-only mode. Delivery has been temporarily disabled from operations.",
                specialNotePrefix: "",
            },
            location: {
                title: "LOCATION",
                phone: "Phone:",
                email: "Email:",
                instagram: "Instagram:",
            },
            newsletter: {
                title: "FEEL LIKE ARCADIA TODAY?",
                subtitle: "Subscribe to our offers and updates",
            },
            reviews: {
                title: "REVIEWS",
                reviewsLabel: "reviews",
            },
            tiles: {
                delivery: {
                    title: "DELIVERY",
                    body: "Place your order and receive it comfortably wherever you are.",
                },
                carta: {
                    title: "MENU",
                    body: "The full menu available to order online in a fast and clear way.",
                },
                menu: {
                    title: "DAILY MENU",
                    body: "Access today’s highlighted menu with a more direct presentation.",
                },
            },
        },
        pages: {
            menu: {
                title: "Daily Menu",
                heroTitle: "DAILY MENU",
                heroSubtitle: "Special dishes selected by our chef.",
            },
            carta: {
                title: "Menu",
                heroTitle: "MENU",
                heroSubtitle: "Browse our menu organised by categories.",
                backToTop: "↑ top",
                noProducts: "There are no available products.",
            },
            checkout: {
                title: "Complete order",
                pausedTitle: "Orders temporarily paused",
                pausedBody:
                    "We are not accepting orders right now. Please check again later.",
                specialTitle: "Special availability today",
                specialHeading: "is being resolved through an exception",
                specialBody:
                    "Today availability does not come only from the base schedule. One of the channels is governed by a temporary exception, so you may see different time windows or temporary closures.",
                local: "On site",
                pickup: "Pickup",
                delivery: "Delivery",
                open: "Open",
                closed: "Closed",
                available: "Available",
                unavailable: "Unavailable",
                pickupOnly: "Pickup only",
                sourceSpecial: "Active exception",
                sourceSpecialClosed: "Closing exception",
                sourceWeekly: "Weekly schedule",
                sourceWeeklyClosed: "Weekly closed slot",
                sourceBase: "Base schedule",
                forcePickupNote:
                    "We are currently operating in pickup-only mode, so even if there is a special delivery slot today checkout will continue as pickup.",
            },
            pedir: {
                title: "Order",
            },
        },
    },

    fr: {
        common: {
            days: {
                Lunes: "Lundi",
                Martes: "Mardi",
                Miércoles: "Mercredi",
                Jueves: "Jeudi",
                Viernes: "Vendredi",
                Sábado: "Samedi",
                Domingo: "Dimanche",
            },
            closed: "Fermé",
            pickup: "Retrait",
            delivery: "Livraison",
            local: "Sur place",
            channel: "Canal",
        },
        home: {
            hero: {
                subtitle: "BAR RESTAURANT",
            },
            about: {
                title: "À PROPOS",
                quote: "“La cuisine maison comme à la maison”",
                body: [
                    "Au Bar Restaurant Arcadia, vous trouverez une cuisine maison authentique, préparée avec le temps, le savoir-faire et l’attention d’autrefois. Des produits de qualité et un bon service.",
                    "Une cuisine née de la tradition populaire et du quotidien, celle qui se faisait à la maison et qui reste vivante aujourd’hui chez Arcadia, adaptée aux goûts actuels sans perdre son essence. Des plats généreux et familiaux, pensés aussi bien pour le restaurant que pour être dégustés chez vous grâce à notre service de livraison.",
                ],
            },
            hours: {
                title: "HORAIRES",
                subtitle: "- Organisez-vous sans doutes -",
                localLabel: "SUR PLACE",
                deliveryLabel: "À DOMICILE",
                reserve: "Réserver une table",
                orderNow: "Commander",
                open: "Ouvert",
                closed: "Fermé",
                available: "Disponible",
                unavailable: "Indisponible",
                pickupOnly: "Retrait uniquement",
                pauseOrdersMessage:
                    "Les commandes sont temporairement suspendues par l’opérationnel. Vous pouvez consulter les horaires, mais la prise de commande peut ne pas être disponible pour le moment.",
                forcePickupMessageBase:
                    "Nous travaillons actuellement uniquement en retrait. La livraison a été temporairement désactivée par l’opérationnel.",
                specialNotePrefix: "",
            },
            location: {
                title: "EMPLACEMENT",
                phone: "Téléphone :",
                email: "Email :",
                instagram: "Instagram :",
            },
            newsletter: {
                title: "ENVIE D’ARCADIA AUJOURD’HUI ?",
                subtitle: "Inscrivez-vous à nos offres et nouveautés",
            },
            reviews: {
                title: "AVIS",
                reviewsLabel: "avis",
            },
            tiles: {
                delivery: {
                    title: "LIVRAISON",
                    body: "Passez votre commande pour la recevoir confortablement où vous voulez.",
                },
                carta: {
                    title: "CARTE",
                    body: "Toute la carte disponible pour commander en ligne de façon rapide et claire.",
                },
                menu: {
                    title: "MENU",
                    body: "Accédez au menu du jour mis en avant avec une présentation plus directe.",
                },
            },
        },
        pages: {
            menu: {
                title: "Menu",
                heroTitle: "MENU",
                heroSubtitle: "Plats spéciaux sélectionnés par notre chef.",
            },
            carta: {
                title: "Carte",
                heroTitle: "CARTE",
                heroSubtitle: "Consultez notre carte organisée par catégories.",
                backToTop: "↑ haut",
                noProducts: "Aucun produit disponible.",
            },
            checkout: {
                title: "Finaliser la commande",
                pausedTitle: "Commandes temporairement suspendues",
                pausedBody:
                    "Nous n’acceptons pas de commandes pour le moment. Merci de réessayer plus tard.",
                specialTitle: "Disponibilité spéciale aujourd’hui",
                specialHeading: "est résolue par une exception",
                specialBody:
                    "Aujourd’hui, la disponibilité ne dépend pas uniquement de l’horaire de base. L’un des canaux est régi par une exception ponctuelle, ce qui peut afficher d’autres créneaux ou des fermetures temporaires.",
                local: "Sur place",
                pickup: "Retrait",
                delivery: "Livraison",
                open: "Ouvert",
                closed: "Fermé",
                available: "Disponible",
                unavailable: "Indisponible",
                pickupOnly: "Retrait uniquement",
                sourceSpecial: "Exception active",
                sourceSpecialClosed: "Exception de fermeture",
                sourceWeekly: "Horaire hebdomadaire",
                sourceWeeklyClosed: "Fermeture hebdomadaire",
                sourceBase: "Horaire de base",
                forcePickupNote:
                    "Nous travaillons actuellement uniquement en retrait, donc même s’il existe aujourd’hui une plage spéciale de livraison, le checkout continuera en retrait.",
            },
            pedir: {
                title: "Commander",
            },
        },
    },
};

export function getPublicCopy(lang: SiteLang) {
    return publicCopy[lang] ?? publicCopy[DEFAULT_LANG];
}

export function translateDayLabel(label: string, lang: SiteLang) {
    const copy = getPublicCopy(lang);
    return copy.common.days[label] ?? label;
}

export function translateWeeklyValue(value: string, lang: SiteLang) {
    const copy = getPublicCopy(lang);
    if (value === "Descanso") return copy.common.closed;
    return value;
}

function safeNote(value: string | null | undefined) {
    const note = String(value ?? "").trim();
    return note || null;
}

function channelLabel(channel: string | null | undefined, lang: SiteLang) {
    const copy = getPublicCopy(lang);
    switch (String(channel ?? "").trim().toUpperCase()) {
        case "DINE_IN":
            return copy.common.local;
        case "PICKUP":
            return copy.common.pickup;
        case "DELIVERY":
            return copy.common.delivery;
        default:
            return copy.common.channel;
    }
}

export function buildPublicOperationalMessage(
    availability: PublicAvailabilityLike,
    lang: SiteLang,
) {
    const copy = getPublicCopy(lang);

    if (availability.pauseOrders) {
        return copy.home.hours.pauseOrdersMessage;
    }

    if (availability.forcePickup) {
        const note = safeNote(availability.sourceNotes?.delivery);
        return note
            ? `${copy.home.hours.forcePickupMessageBase} ${note}`
            : copy.home.hours.forcePickupMessageBase;
    }

    const specialNotes = (availability.specialDateNotes ?? [])
        .map((item) => {
            const note = safeNote(item.note);
            if (!note) return null;
            return `${channelLabel(item.channel, lang)}: ${note}`;
        })
        .filter((item): item is string => Boolean(item));

    return specialNotes.join(" · ");
}