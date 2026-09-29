export const CSV_HEADER =
  "FirstName,LastName,NickName,PhoneticName,Ability,ClassName,IsPaid,PillNumber,LocalRegisteredDateTime,RegistrationNumber,Region,FrameNumber,TireNumber,PermanentNumber,PrimaryColor,SecondaryColor,Manufacturer,ChassisManufacturer,ModelName,ModelYear,TransponderNumber,CarID,GPSTransponderNumber,SponsorName,Email,PhoneNumber,Birthday,Gender,Address1,Address2,City,State,ZipCode,Country,Hometown,BRCANumber,BRCARegion,BRCADriverRanking,BRCAFormulaGrade,BRCASkillLevel,BRCAIsYoungJunior,BRCAIsJunior,BRCAIsMasters,EFRAAbility,ClubName,ClubRegion,AmericanMotorcyclistAssociationNumber,AmericanMotorcyclistAssociationExpirationDate,AcademyOfModelAeronauticsNumber,AcademyOfModelAeronauticsExpirationDate,HAMCallSign,FAANumber,IJSBANumber,LocalMembershipType,LocalMembershipCode,LocalMembershipExpirationDate";

export type Row = {
  first_name: string; last_name: string; nickname: string | null; email: string;
  phone: string | null; club: string | null; created_at: string;
  category: string; transponder: string | null;
  chassis_brand: string | null; engine_brand: string | null; esc_brand: string | null; tire_brand: string | null;
};

const esc = (v: string | null | undefined) => {
  const s = v ?? "";
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function buildCsv(rows: Row[]) {
  const cols = CSV_HEADER.split(",");
  const lines = rows.map((r) => {
    const m: Record<string, string> = {
      FirstName: r.first_name, LastName: r.last_name, NickName: r.nickname ?? "",
      ClassName: r.category, IsPaid: "false", LocalRegisteredDateTime: r.created_at,
      TireNumber: r.tire_brand ?? "", Manufacturer: r.engine_brand ?? "",
      ChassisManufacturer: r.chassis_brand ?? "", ModelName: r.esc_brand ? `ESC: ${r.esc_brand}` : "", TransponderNumber: r.transponder ?? "",
      Email: r.email, PhoneNumber: r.phone ?? "", ClubName: r.club ?? "",
    };
    return cols.map((c) => esc(m[c])).join(",");
  });
  return "﻿" + [CSV_HEADER, ...lines].join("\r\n") + "\r\n";
}
