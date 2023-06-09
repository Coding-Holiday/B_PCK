const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendPushNotification = functions.firestore.document('ticket/{ticketId}')
  .onCreate(async (snapshot, context) => {
    const ticketData = snapshot.data();

    const departureDate = ticketData.startDate.toDate();
    const currentDate = new Date();
    if (isSameDay(departureDate, currentDate)) {
      const departureAirport = ticketData.departureAirport;
      const arrivalTime = ticketData.arrivalTime;

      const uid = ticketData.uid;

      // 사용자의 푸시 알림 토큰 조회
      const userTokens = await getUserPushTokens(uid);

      if (userTokens.length > 0) {
        const message = {
          notification: {
            title: 'PreFlightCheck',
            body: `오늘 ${departureAirport}으로 ${arrivalTime} 비행기가 예약되어 있습니다.`,
          },
          tokens: userTokens,
        };

        // 푸시 알림 전송
        return admin.messaging().sendMulticast(message);
      }
    }
    return null;
  });

// 출발 날짜가 같은지 확인하는 함수
function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// 사용자의 푸시 알림 토큰 조회 함수
async function getUserPushTokens(uid) {
  const userRef = admin.firestore().collection('users').doc(uid);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    const userData = userDoc.data();
    if (userData.tokens) {
      return userData.tokens;
    }
  }

  return [];
}
