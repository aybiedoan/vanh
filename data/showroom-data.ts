// ─── Showroom Data ─────────────────────────────────────────────────────────
// Chỉnh sửa captions và đường dẫn hình ảnh tại đây
// Mỗi item tương ứng với một ngôi sao trong view Showroom
// Thứ tự hiển thị sẽ theo thứ tự trong mảng này

export type MemoryItem = {
  /** Đường dẫn hình ảnh, có thể là local (/assets/img/...) hoặc URL */
  image: string
  /** Caption hiển thị khi click vào ngôi sao */
  caption: string
}

// ─── Lời chúc hiển thị lần đầu tiên ─────────────────────────────────────────
// Mỗi dòng sẽ được hiển thị lần lượt với hiệu ứng typewriter
// Giới hạn 2-3 dòng xuất hiện cùng lúc, các dòng cũ sẽ biến mất
export const GREETING_LINES: string[] = [
  'Gửi đến cô bé 2K7 của tôi...',
  'Người đã bước qua bao ngày dài ôn luyện,',
  'những đêm khuya một mình cùng trang sách.',
  'Con đã khóc, đã mệt, đã muốn bỏ cuộc...',
  'Nhưng con vẫn ở đây,',
  'vẫn kiên cường, vẫn bước tiếp.',
  'Hành trình này không chỉ là kỳ thi,',
  'mà là câu chuyện về sự trưởng thành.',
  'Dù kết quả ra sao,',
  'con đã thật sự rất tuyệt vời rồi.',
  'Chúc con bình an, tự tin,',
  'và tỏa sáng theo cách của riêng mình.',
]

// ─── Danh sách ảnh và caption ───────────────────────────────────────────────
export const MEMORIES: MemoryItem[] = [
  {
    image: '/assets/img/pic1.jpg',
    caption: 'Ngày xửa ngày xưa khóc nhè...',
  },
  {
    image: '/assets/img/pic2.jpg',
    caption: 'Bé con tập đi, vấp ngã, lại đứng dậy.',
  },
  {
    image: '/assets/img/pic3.jpg',
    caption: 'Lần đầu cắp sách đến trường, mắt tròn xoe.',
  },
  {
    image: '/assets/img/pic4.jpg',
    caption: 'Góc nhỏ ôn bài, ánh đèn vàng, tách trà còn ấm.',
  },
  {
    image: '/assets/img/pic5.jpg',
    caption: 'Mưa tầm tã, hai đứa trú dưới mái hiên cùng cười.',
  },
  {
    image: '/assets/img/pic6.jpg',
    caption: 'Bài kiểm tra đầu tiên — hồi hộp đến mất ngủ.',
  },
  {
    image: '/assets/img/pic7.jpg',
    caption: 'Chiều hè oi bức, vẫn ngồi ôn bài cần mẫn.',
  },
  {
    image: '/assets/img/pic8.jpg',
    caption: 'Khoảnh khắc bất chợt ngước nhìn bầu trời xanh.',
  },
  {
    image: '/assets/img/pic9.jpg',
    caption: 'Chụp ảnh nhóm trước kỳ thi, ai cũng nở nụ cười.',
  },
  {
    image: '/assets/img/pic10.jpg',
    caption: 'Tối khuya một mình, nhưng không bao giờ thực sự cô đơn.',
  },
  {
    image: '/assets/img/pic11.jpg',
    caption: 'Những trang vở chữ nhỏ li ti, mỗi chữ là một ước mơ.',
  },
  {
    image: '/assets/img/pic12.jpg',
    caption: 'Nụ cười sau khi nhận điểm tốt đầu tiên.',
  },
  {
    image: '/assets/img/pic13.jpg',
    caption: 'Mùa hoa phượng nở đỏ rực, bỗng thấy thời gian qua nhanh.',
  },
  {
    image: '/assets/img/pic14.jpg',
    caption: 'Đứng trước bảng thông báo, tim đập rộn ràng.',
  },
  {
    image: '/assets/img/pic15.jpg',
    caption: 'Buổi học cuối cùng, ai cũng lặng im một chút.',
  },
  {
    image: '/assets/img/pic16.jpg',
    caption: 'Áo dài trắng bay trong gió, đẹp đến nghẹn ngào.',
  },
  {
    image: '/assets/img/pic17.jpg',
    caption: 'Đêm trước kỳ thi lớn — trời trong, lòng bình yên.',
  },
  {
    image: '/assets/img/pic18.jpg',
    caption: 'Sáng sớm ra đi, theo mình là cả một trời hi vọng.',
  },
  {
    image: '/assets/img/pic19.jpg',
    caption: 'Khoảnh khắc nhìn lại, nhận ra mình đã đi xa đến vậy.',
  },
  {
    image: '/assets/img/pic20.jpg',
    caption: 'Giờ đã thành thiếu nữ sắp vượt vũ môn...',
  },
]

// Fallback image generator khi không tìm thấy ảnh
export function getFallbackImage(index: number): string {
  return `https://picsum.photos/seed/lofi${index + 1}/800/600`
}
