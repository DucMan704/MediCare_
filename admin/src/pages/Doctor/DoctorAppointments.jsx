import React, { useState } from "react";
import { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { AppContext } from "../../context/AppContext";
import { toast } from "react-toastify";

const DoctorAppointments = () => {
  const {
    dToken,
    appointments,
    getAppointments,
    cancelAppointment,
    acceptAppointment,
    completeAppointment,
    getMedicalRecordsByUserId,
    createMedicalRecord,
    updateMedicalRecord,
  } = useContext(DoctorContext);
  const { slotDateFormat, calculateAge, currency } = useContext(AppContext);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedMedicalRecord, setSelectedMedicalRecord] = useState(null);
  const [isCreatingNewRecord, setIsCreatingNewRecord] = useState(false);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [savingMedicalRecord, setSavingMedicalRecord] = useState(false);
  const [draftMedicalRecord, setDraftMedicalRecord] = useState({
    examination: "",
    symptoms: "",
    medicalHistory: "",
    height: "",
    weight: "",
    bmi: "",
    temperature: "",
    heartRate: "",
    systolic: "",
    diastolic: "",
    respiratoryRate: "",
    oxygenSaturation: "",
  });

  useEffect(() => {
    if (dToken) {
      getAppointments();
    }
  }, [dToken]);

  useEffect(() => {
    if (!dToken) return;

    const intervalId = setInterval(() => {
      getAppointments();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [dToken, getAppointments]);

  const openMedicalRecordPopup = async (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedMedicalRecord(null);
    setIsCreatingNewRecord(false);
    setMedicalRecords([]);
    setRecordsLoading(true);
    setDraftMedicalRecord({
      examination: "",
      symptoms: "",
      medicalHistory: "",
      height: "",
      weight: "",
      bmi: "",
      temperature: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    });

    const records = await getMedicalRecordsByUserId(appointment.userId);
    setMedicalRecords(records);
    setRecordsLoading(false);
  };

  const closeMedicalRecordPopup = () => {
    setSelectedAppointment(null);
    setSelectedMedicalRecord(null);
    setIsCreatingNewRecord(false);
    setMedicalRecords([]);
    setRecordsLoading(false);
    setSavingMedicalRecord(false);
    setDraftMedicalRecord({
      examination: "",
      symptoms: "",
      medicalHistory: "",
      height: "",
      weight: "",
      bmi: "",
      temperature: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    });
  };

  const handleDraftFieldChange = (event) => {
    const { name, value } = event.target;
    setDraftMedicalRecord((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const loadMedicalRecordIntoForm = (recordWrapper) => {
    //nếu doctorId = doctorId của appointment thì mới load vào form, nếu không thì không load
    if (
      recordWrapper.medicalRecordId?.doctorId?._id !==
      selectedAppointment?.docData?._id
    ) {
      toast.error(
        "Bạn không thể chỉnh sửa hồ sơ y tế của bác sĩ khác. Vui lòng tạo hồ sơ mới.",
      );
      return;
    }
    const record = recordWrapper.medicalRecordId || {};
    setSelectedMedicalRecord(recordWrapper);
    setIsCreatingNewRecord(false);
    setDraftMedicalRecord({
      examination: record.examination || "",
      symptoms: Array.isArray(record.symptoms)
        ? record.symptoms.join(", ")
        : "",
      medicalHistory: record.medicalHistory || "",
      height: record.vitalSigns?.height ?? "",
      weight: record.vitalSigns?.weight ?? "",
      bmi: record.vitalSigns?.bmi ?? "",
      temperature: record.vitalSigns?.temperature ?? "",
      heartRate: record.vitalSigns?.heartRate ?? "",
      systolic: record.vitalSigns?.bloodPressure?.systolic ?? "",
      diastolic: record.vitalSigns?.bloodPressure?.diastolic ?? "",
      respiratoryRate: record.vitalSigns?.respiratoryRate ?? "",
      oxygenSaturation: record.vitalSigns?.oxygenSaturation ?? "",
    });
  };

  const startNewMedicalRecord = () => {
    setSelectedMedicalRecord(null);
    setIsCreatingNewRecord(true);
    setDraftMedicalRecord({
      examination: "",
      symptoms: "",
      medicalHistory: "",
      height: "",
      weight: "",
      bmi: "",
      temperature: "",
      heartRate: "",
      systolic: "",
      diastolic: "",
      respiratoryRate: "",
      oxygenSaturation: "",
    });
  };

  const handleSaveMedicalRecord = async () => {
    if (!selectedAppointment) return;

    if (!draftMedicalRecord.examination.trim()) {
      toast.error("Vui lòng nhập chẩn đoán trước khi lưu");
      return;
    }

    setSavingMedicalRecord(true);

    const payload = {
      userId: selectedAppointment.userId,
      ...draftMedicalRecord,
    };

    const savedRecord = selectedMedicalRecord
      ? await updateMedicalRecord(
          selectedMedicalRecord.medicalRecordId?._id,
          payload,
        )
      : await createMedicalRecord(payload);

    if (savedRecord) {
      const records = await getMedicalRecordsByUserId(
        selectedAppointment.userId,
      );
      setMedicalRecords(records);
      closeMedicalRecordPopup();
    }

    setSavingMedicalRecord(false);
  };

  const renderMedicalRecordForm = () => (
    <div className="space-y-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-700">
          {selectedMedicalRecord
            ? `Đang chỉnh sửa hồ sơ y tế cho bác sĩ ${selectedAppointment?.docData?.name}.`
            : `Chưa có hồ sơ y tế. Nhập thông số cho bác sĩ ${selectedAppointment?.docData?.name} tại đây.`}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Chẩn đoán / Khám bệnh
            </label>
            <input
              name="examination"
              value={draftMedicalRecord.examination}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Nhập nội dung chẩn đoán"
              type="text"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Triệu chứng
            </label>
            <input
              name="symptoms"
              value={draftMedicalRecord.symptoms}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Ví dụ: sốt, ho, đau đầu"
              type="text"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Tiền sử bệnh
            </label>
            <textarea
              name="medicalHistory"
              value={draftMedicalRecord.medicalHistory}
              onChange={handleDraftFieldChange}
              className="min-h-24 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Nhập tiền sử bệnh"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Chiều cao
            </label>
            <input
              name="height"
              value={draftMedicalRecord.height}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="cm"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Cân nặng
            </label>
            <input
              name="weight"
              value={draftMedicalRecord.weight}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="kg"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              BMI
            </label>
            <input
              name="bmi"
              value={draftMedicalRecord.bmi}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="BMI"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nhiệt độ
            </label>
            <input
              name="temperature"
              value={draftMedicalRecord.temperature}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="°C"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nhịp tim
            </label>
            <input
              name="heartRate"
              value={draftMedicalRecord.heartRate}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="bpm"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Huyết áp tâm thu
            </label>
            <input
              name="systolic"
              value={draftMedicalRecord.systolic}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="mmHg"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Huyết áp tâm trương
            </label>
            <input
              name="diastolic"
              value={draftMedicalRecord.diastolic}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="mmHg"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Nhịp thở
            </label>
            <input
              name="respiratoryRate"
              value={draftMedicalRecord.respiratoryRate}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="breaths/min"
              type="text"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              SpO2
            </label>
            <input
              name="oxygenSaturation"
              value={draftMedicalRecord.oxygenSaturation}
              onChange={handleDraftFieldChange}
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="%"
              type="text"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSaveMedicalRecord}
            disabled={savingMedicalRecord}
            className="rounded bg-primary px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingMedicalRecord ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl m-5 ">
      <p className="mb-3 text-lg font-medium">Tất cả lịch hẹn</p>

      <div className="bg-white border rounded text-sm max-h-[80vh] overflow-y-scroll">
        <div className="max-sm:hidden grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 py-3 px-6 border-b">
          <p>#</p>
          <p>Bệnh nhân</p>
          <p>Thanh toán</p>
          <p>Tuổi</p>
          <p>Ngày & Giờ</p>
          <p>Phí</p>
          <p>Thao tác</p>
        </div>
        {appointments.map((item, index) => (
          <div
            className="flex flex-wrap justify-between max-sm:gap-5 max-sm:text-base sm:grid grid-cols-[0.5fr_2fr_1fr_1fr_3fr_1fr_1fr] gap-1 items-center text-gray-500 py-3 px-6 border-b hover:bg-gray-50"
            key={index}
            onClick={() => openMedicalRecordPopup(item)}
            role="button"
            tabIndex={0}
          >
            <p className="max-sm:hidden">{index}</p>
            <div className="flex items-center gap-2">
              <img
                onClick={(event) => event.stopPropagation()}
                src={item.userData.image}
                className="w-8 rounded-full"
                alt=""
              />{" "}
              <p>{item.userData.name}</p>
            </div>
            <div>
              <p className="text-xs inline border border-primary px-2 rounded-full">
                {item.payment ? "Online" : "Tiền mặt"}
              </p>
            </div>
            <p className="max-sm:hidden">{calculateAge(item.userData.dob)}</p>
            <p>
              {slotDateFormat(item.slotDate)}, {item.slotTime}
            </p>
            <p>
              {item.amount}
              {currency}
            </p>
            {item.cancelled ? (
              <p className="text-red-400 text-xs font-medium">Đã hủy</p>
            ) : item.isCompleted ? (
              <p className="text-green-500 text-xs font-medium">Đã hẹn</p>
            ) : !item.isAccepted ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    cancelAppointment(item._id);
                  }}
                  className="rounded border border-red-200 px-3 py-2 text-xs font-medium text-red-500"
                >
                  Hủy
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    acceptAppointment(item._id);
                  }}
                  className="rounded bg-primary px-3 py-2 text-xs font-medium text-white"
                >
                  Chấp nhận
                </button>
              </div>
            ) : (
              <p className="text-green-500 text-xs font-medium">Đã chấp nhận</p>
            )}
          </div>
        ))}
      </div>

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="text-lg font-semibold text-gray-800">
                  Medical Record
                </p>
                <p className="text-sm text-gray-500">
                  Bệnh nhân: {selectedAppointment.userData?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {slotDateFormat(selectedAppointment.slotDate)},{" "}
                  {selectedAppointment.slotTime}
                </p>
              </div>
              <button
                onClick={closeMedicalRecordPopup}
                className="rounded-full border px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Đóng
              </button>
            </div>

            <div className="px-6 py-5">
              {recordsLoading ? (
                <p className="text-sm text-gray-500">Đang tải hồ sơ...</p>
              ) : medicalRecords.length === 0 || isCreatingNewRecord ? (
                renderMedicalRecordForm()
              ) : (
                <div className="space-y-4">
                  {selectedMedicalRecord && renderMedicalRecordForm()}
                  {medicalRecords
                    .filter(
                      (recordWrapper) =>
                        recordWrapper.medicalRecordId?._id !==
                        selectedMedicalRecord?.medicalRecordId?._id,
                    )
                    .map((recordWrapper, index) => {
                      const record = recordWrapper.medicalRecordId || {};
                      const isActiveRecord =
                        selectedMedicalRecord?.medicalRecordId?._id ===
                        recordWrapper.medicalRecordId?._id;
                      return (
                        <div
                          key={recordWrapper._id || index}
                          className={`rounded-lg border p-4 transition ${
                            isActiveRecord
                              ? "cursor-not-allowed border-primary bg-blue-50 opacity-60"
                              : "cursor-pointer border-gray-200 bg-gray-50 hover:border-primary hover:bg-white"
                          }`}
                          onClick={() => {
                            if (!isActiveRecord) {
                              loadMedicalRecordIntoForm(recordWrapper);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-800">
                                {record.examination || "Khám bệnh"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Bác sĩ: {record.doctorId?.name || "Không rõ"}
                              </p>
                            </div>
                            <p className="text-xs text-gray-500">
                              {recordWrapper.createdAt
                                ? new Date(
                                    recordWrapper.createdAt,
                                  ).toLocaleString()
                                : ""}
                            </p>
                          </div>

                          <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                            <p>
                              <span className="font-medium text-gray-800">
                                Triệu chứng:
                              </span>{" "}
                              {Array.isArray(record.symptoms) &&
                              record.symptoms.length > 0
                                ? record.symptoms.join(", ")
                                : "Chưa cập nhật"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Tiền sử:
                              </span>{" "}
                              {record.medicalHistory || "Chưa cập nhật"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Chiều cao:
                              </span>{" "}
                              {record.vitalSigns?.height ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Cân nặng:
                              </span>{" "}
                              {record.vitalSigns?.weight ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                BMI:
                              </span>{" "}
                              {record.vitalSigns?.bmi ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Nhiệt độ:
                              </span>{" "}
                              {record.vitalSigns?.temperature ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Nhịp tim:
                              </span>{" "}
                              {record.vitalSigns?.heartRate ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Huyết áp:
                              </span>{" "}
                              {record.vitalSigns?.bloodPressure
                                ? `${record.vitalSigns.bloodPressure.systolic ?? "-"}/${record.vitalSigns.bloodPressure.diastolic ?? "-"}`
                                : "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                Nhịp thở:
                              </span>{" "}
                              {record.vitalSigns?.respiratoryRate ?? "-"}
                            </p>
                            <p>
                              <span className="font-medium text-gray-800">
                                SpO2:
                              </span>{" "}
                              {record.vitalSigns?.oxygenSaturation ?? "-"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 shadow-sm">
                <div className="flex justify-center">
                  <button
                    onClick={startNewMedicalRecord}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-primary hover:text-primary"
                  >
                    <img src="/plus.svg" alt="" className="h-4 w-4" />
                    <span>Thêm hồ sơ mới</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;
