export const CSV_HEADER =
  "FirstName,LastName,NickName,PhoneticName,Ability,ClassName,IsPaid,PillNumber,LocalRegisteredDateTime,RegistrationNumber,Region,FrameNumber,TireNumber,PermanentNumber,PrimaryColor,SecondaryColor,Manufacturer,ChassisManufacturer,ModelName,ModelYear,TransponderNumber,CarID,GPSTransponderNumber,SponsorName,Email,PhoneNumber,Birthday,Gender,Address1,Address2,City,State,ZipCode,Country,Hometown,BRCANumber,BRCARegion,BRCADriverRanking,BRCAFormulaGrade,BRCASkillLevel,BRCAIsYoungJunior,BRCAIsJunior,BRCAIsMasters,EFRAAbility,ClubName,ClubRegion,AmericanMotorcyclistAssociationNumber,AmericanMotorcyclistAssociationExpirationDate,AcademyOfModelAeronauticsNumber,AcademyOfModelAeronauticsExpirationDate,HAMCallSign,FAANumber,IJSBANumber,LocalMembershipType,LocalMembershipCode,LocalMembershipExpirationDate";

export type Row = {
  first_name: string; last_name: string; nickname: string | null; email: string;
  phone: string | null; club: string | null; created_at: string;
  registration_id: string; email_optin: boolean; paid: boolean;
  category: string; transponder: string | null;
  chassis_brand: string | null; engine_brand: string | null; esc_brand: string | null; tire_brand: string | null;
};

const esc = (v: string | null | undefined) => {
  const s = v ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Lista oficial de "Chassis Manufacturers" (edición RC) de la LiveTime Import and Export Guide.
// El import exige nombre y ortografía exactos.
const LIVETIME_CHASSIS = [
  "1RC", "3 Racing", "577 Designs", "Agama", "ARC", "ARRMA", "Atomic", "Awesomatix", "Axon", "BMS", "Buri Racer",
  "C&C", "Capricorn", "Carisma", "Chandler Precision", "CJC", "Club Race Hero", "Contrast", "Corally", "CRC",
  "Custom Works", "Destiny", "DRC", "Durango", "Elcon Models", "ERC", "Excelerate", "Exotek", "FG", "FID",
  "Five Seven Designs", "Five Star", "FTX", "Genius", "Ghost", "GIMAR", "GL Racing", "Grand Prix 3D", "Harm",
  "HB Racing", "Hobby Pro", "Hong Nor", "Hörmann", "HPI", "Hyperdrive", "IGT8", "Impact", "Infinity", "Iris",
  "JQ Racing", "King Motor", "KSG", "KSKT", "Kyosho", "Leading Edge", "Losi", "Mayako", "MCD", "McPappy",
  "Mecatech", "MST", "Mugen Seiki", "Nooner RC", "NRP", "OFNA", "Ovalwerks", "Pemberton Raceworks", "PN Racing",
  "PR", "R1 Wurks", "Race-Opt", "RCMaker", "Reflex Racing", "RIP", "RJ Speed", "Roche", "Rovan", "Royalty",
  "RC Mfg", "RS5", "Sagan", "Salvas MudBoss", "Schepis", "Schumacher", "Serpent", "Shepherd Racing", "SOAR",
  "Sparko", "Spec 10", "Stack RC", "SWorkz", "Tamiya", "TARP", "TCR", "Team Associated", "Team C", "Team CSO",
  "Team GFRP", "Team Magic", "Team Qik", "Tekno", "TLR", "Traxxas", "TRG", "Trinity", "Triple P RC", "TSR",
  "Tsunami", "Undercover", "Vanishing Point RC", "VBC", "Vyne Industries", "Willspeed", "Woods Racing", "WRC",
  "XFactory", "Xpress", "XRay", "Xtreme Racing", "Yokomo",
];
const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
const CHASSIS_BY_KEY = new Map(LIVETIME_CHASSIS.map((n) => [norm(n), n]));
// Nombres que usa el formulario y difieren de la lista oficial
for (const [alias, official] of [["mugen", "Mugen Seiki"], ["shepherd", "Shepherd Racing"], ["associated", "Team Associated"]] as const)
  CHASSIS_BY_KEY.set(alias, official);

/** Nombre del chasis según la lista de LiveTime, o "" si no figura (en ese caso se exporta vacío). */
export const liveTimeChassis = (brand: string | null | undefined) => CHASSIS_BY_KEY.get(norm(brand ?? "")) ?? "";

/** El import espera un entero; cualquier otra cosa se exporta vacía. */
export const liveTimeTransponder = (t: string | null | undefined) => (/^\d+$/.test((t ?? "").trim()) ? (t ?? "").trim() : "");

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "numeric", day: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
});
/** Formato que pide la guía: M/d/yyyy hh:mm:ss AM|PM (ej. 4/21/2024 11:50:30 PM), en hora de Argentina. */
export function liveTimeDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = Object.fromEntries(DATE_FMT.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.month}/${p.day}/${p.year} ${p.hour}:${p.minute}:${p.second} ${String(p.dayPeriod).toUpperCase()}`;
}

/** Datos que no entran en el CSV de importación (para avisar en el panel). */
export function csvWarnings(rows: Row[]) {
  return {
    chassisNotInList: rows.filter((r) => r.chassis_brand && !liveTimeChassis(r.chassis_brand)).length,
    transponderNotNumeric: rows.filter((r) => r.transponder && !liveTimeTransponder(r.transponder)).length,
  };
}

/**
 * CSV para Data/Event > Import de LiveTime (GenericImport.csv). Solo se exporta lo que el import admite:
 * motor, variador y marca de gomas no tienen campo equivalente en la edición RC (Manufacturer es de MX/KART/MS/DRAG,
 * TireNumber es un código de 4 caracteres, ModelName es el modelo del vehículo), así que salen vacíos.
 * UTF-8 sin BOM y CRLF, igual que el archivo de ejemplo de LiveTime.
 */
export function buildCsv(rows: Row[]) {
  const cols = CSV_HEADER.split(",");
  const lines = rows.map((r) => {
    const m: Record<string, string> = {
      FirstName: r.first_name, LastName: r.last_name, NickName: r.nickname ?? "",
      ClassName: r.category, IsPaid: r.paid ? "true" : "false", LocalRegisteredDateTime: liveTimeDate(r.created_at),
      ChassisManufacturer: liveTimeChassis(r.chassis_brand), TransponderNumber: liveTimeTransponder(r.transponder),
      Email: r.email, PhoneNumber: r.phone ?? "", ClubName: r.club ?? "",
    };
    return cols.map((c) => esc(m[c])).join(",");
  });
  return [CSV_HEADER, ...lines].join("\r\n") + "\r\n";
}
