import { Species, AnimalStatus, ApplicationStatus, Size } from "@prisma/client"

export const SPECIES_LABELS: Record<Species, string> = {
  DOG: "Dog", CAT: "Cat", RABBIT: "Rabbit", BIRD: "Bird",
  SMALL_ANIMAL: "Small Animal", FARM: "Farm Animal", REPTILE: "Reptile", OTHER: "Other",
}

export const SPECIES_EMOJI: Record<Species, string> = {
  DOG: "🐕", CAT: "🐈", RABBIT: "🐇", BIRD: "🐦",
  SMALL_ANIMAL: "🐹", FARM: "🐄", REPTILE: "🦎", OTHER: "🐾",
}

export const STATUS_LABELS: Record<AnimalStatus, string> = {
  INTAKE: "Intake",
  ASSESSMENT: "Assessment",
  AVAILABLE: "Available",
  FOSTERED: "In Foster",
  IN_FOSTER: "In Foster",
  ADOPTION_PENDING: "Adoption Pending",
  ADOPTED: "Adopted",
  TRANSFERRED: "Transferred",
  DECEASED: "Deceased",
  ON_HOLD: "On Hold",
  MEDICAL_HOLD: "Medical Hold",
  QUARANTINE: "Quarantine",
}

export const STATUS_COLORS: Record<AnimalStatus, string> = {
  INTAKE: "bg-amber-100 text-amber-800",
  ASSESSMENT: "bg-purple-100 text-purple-800",
  AVAILABLE: "bg-green-100 text-green-800",
  FOSTERED: "bg-blue-100 text-blue-800",
  IN_FOSTER: "bg-blue-100 text-blue-800",
  ADOPTION_PENDING: "bg-orange-100 text-orange-800",
  ADOPTED: "bg-emerald-100 text-emerald-800",
  TRANSFERRED: "bg-gray-100 text-gray-700",
  DECEASED: "bg-red-100 text-red-800",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  MEDICAL_HOLD: "bg-red-100 text-red-800",
  QUARANTINE: "bg-yellow-100 text-yellow-800",
}

export const APP_STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "Pending",
  REVIEWING: "Reviewing",
  UNDER_REVIEW: "Under Review",
  HOME_CHECK: "Home Check",
  HOME_CHECK_SCHEDULED: "Home Check Scheduled",
  HOME_CHECK_DONE: "Home Check Done",
  APPROVED: "Approved",
  CONTRACT_SENT: "Contract Sent",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  COMPLETED: "Completed",
}

export const SIZE_LABELS: Record<Size, string> = {
  TINY: "Tiny", SMALL: "Small", MEDIUM: "Medium", LARGE: "Large", XLARGE: "Extra Large",
}

export const COUNTIES = [
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry", "Donegal", "Down",
  "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare", "Kilkenny", "Laois", "Leitrim",
  "Limerick", "Longford", "Louth", "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon",
  "Sligo", "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow",
  "Bedfordshire", "Berkshire", "Bristol", "Buckinghamshire", "Cambridgeshire", "Cheshire",
  "Cornwall", "Devon", "Dorset", "Essex", "Gloucestershire", "Hampshire", "Hertfordshire",
  "Kent", "Lancashire", "Leicestershire", "London", "Manchester", "Norfolk", "Northamptonshire",
  "Northumberland", "Nottinghamshire", "Oxfordshire", "Somerset", "Suffolk", "Surrey",
  "Sussex", "Warwickshire", "West Midlands", "Yorkshire",
  "Aberdeen", "Edinburgh", "Glasgow", "Highlands", "Inverness",
  "Cardiff", "Swansea",
]
