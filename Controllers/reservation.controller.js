let reservations = []; // 임시 데이터베이스

const reservationController = {
    saveReservation: async (reservationData) => {
        const reservation = {
            id: reservations.length + 1,
            ...reservationData,
            status: "pending", // 예약 상태 (대기 중)
            createdAt: new Date(),
        };
        reservations.push(reservation);
        return reservation;
    },

    getAllReservations: async () => {
        return reservations;
    },

    updateReservationStatus: async (reservationId, status) => {
        const reservation = reservations.find((res) => res.id === reservationId);
        if (!reservation) throw new Error("Reservation not found");

        reservation.status = status;
        return reservation;
    }
};

export default reservationController;  // 하나의 객체로 default export
