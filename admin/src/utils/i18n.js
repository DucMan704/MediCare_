export const specialityLabels = {
  "Bác sĩ đa khoa": "Bác sĩ đa khoa",
  "Sản phụ khoa": "Sản phụ khoa",
  "Da liễu": "Da liễu",
  "Nhi khoa": "Nhi khoa",
  "Thần kinh": "Thần kinh",
  "Tiêu hóa": "Tiêu hóa",
};

export const specialityList = Object.keys(specialityLabels);

export const monthsVi = [
  "Th1",
  "Th2",
  "Th3",
  "Th4",
  "Th5",
  "Th6",
  "Th7",
  "Th8",
  "Th9",
  "Th10",
  "Th11",
  "Th12",
];

export const monthNamesVi = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export const weekDaysVi = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export const defaultTimeSlots = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

export const formatSlotDate = (slotDate) => {
  const dateArray = slotDate.split("_");
  return `${dateArray[0]} ${monthsVi[Number(dateArray[1]) - 1]} ${dateArray[2]}`;
};

export const translateExperience = (exp) => {
  if (!exp) return exp;
  return exp.replace(/(\d+)\s*Year(s)?/i, "$1 năm");
};
