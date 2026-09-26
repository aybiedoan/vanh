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
// export const GREETING_LINES: string[] = [
//   '...',
//   'Gửi ngại ngùng gơ...',
//   'Ờm thì...',
//   'Hôm qua là ngày 1/6',
//   'Anh hỏi em có còn nhỏ khom',
//   'để anh tặng quà á :>',
//   'Mà thực ra... ',
//   '1/6 chỉ là cái cớ thui.',
//   'Đúng hơn là anh muốn làm cái gì đó',
//   'để động viên em.',
//   'Anh hi vọng món quà nhỏ này',
//   'sẽ truyền động lực ',
//   'và tiếp thêm 200% năng lượng cho em',
//   'vào những ngày ôn thi cuối cùng. 😘',
//   'Dù mình quen biết chưa lâu, ',
//   'nhưng anh cực kỳ mong',
//   'em sẽ đỗ vào trường mình muốn, ',
//   'học ngành mình thích.',
//   'Cố lên nhaaa',
//   'À, em có thể dán link YouTube vào đây ',
//   'để vừa học vừa chill với nhạc nhé.',
//   'Còn lúc nào thấy mệt mỏi quá',
//   'Thì bấm vào cái nút ở góc để sạc pin nhé, ',
//   'sẽ có bất ngờ đó 😉',
//   'Bài nhạc nền này có tên là "Một đường nở hoa", ',
//   'anh hi vọng con đường em đi sau này',
//   'cũng sẽ giống như vậy, ',
//   'luôn ngập tràn hoa nở và những điều tốt đẹp.',
//   'Chấm bút.',
//   'Gửi từ người anh thân thiện nhất vũ trụ 😇'
// ];
export const GREETING_LINES: string[] = [
  'Đọc một lần là đủ rùi',
];

// ─── Danh sách ảnh và caption ───────────────────────────────────────────────
export const MEMORIES: MemoryItem[] = [
  { image: "assets/img/memory-01.webp", caption: "eooo, đoán xem, vanh với gấu, ai cute hơn ☺️" },
  { image: "assets/img/memory-02.webp", caption: "Nhìn quạo dị thui chứ deth lắm đó nha" },
  { image: "assets/img/memory-03.webp", caption: "Đủ ngầu rùi đó, áo đỏ chứng tỏ..." },
  { image: "assets/img/memory-04.webp", caption: "xinh" },
  { image: "assets/img/memory-05.webp", caption: "quý sờ tộc" },
  { image: "assets/img/memory-06.webp", caption: "nữ tính quá dị" },
  { image: "assets/img/memory-07.webp", caption: "oii, vanh nhà ai mà thơ dị" },
  { image: "assets/img/memory-08.webp", caption: "ai nói người đâu mà đẹp như tranh, sai rồi, phải là ..." },
  { image: "assets/img/memory-09.webp", caption: "7 lía đang chill, xin đừng làm phiền" },
  { image: "assets/img/memory-10.webp", caption: "góc nghiêng thần thánh đó sao" },
  { image: "assets/img/memory-11.webp", caption: "tranh làm gì có cửa với nàng" },
  { image: "assets/img/memory-12.webp", caption: "vanh bảo là vanh đẹpp" },
  { image: "assets/img/memory-13.webp", caption: "gác chân đó, ngầu không 😎" },
  { image: "assets/img/memory-14.webp", caption: "công túa giữa vườn hoa" },
  { image: "assets/img/memory-15.webp", caption: "chị toi đấy, đẹp, ngầu, slay" },
  { image: "assets/img/memory-16.webp", caption: "oi, an an là mặt trời nhỏ 🌞" },
  { image: "assets/img/memory-17.webp", caption: "khoe vòng tay nè" },
  { image: "assets/img/memory-18.webp", caption: "được trai theo từ bé đó" },
  { image: "assets/img/memory-19.webp", caption: "dễ thương khom, tóc 2 bím nè" },
  { image: "assets/img/memory-20.webp", caption: "vanh bảo không biết selfie nhưng đã biết đăng ảnh selfie từ tiểu học :(" },
  { image: "assets/img/memory-21.webp", caption: "bộ cầm hộp đũa vui lắm hả mà cười toe toét thế kia" },
  { image: "assets/img/memory-22.webp", caption: "điệu từ bé đó" },
  { image: "assets/img/memory-23.webp", caption: "Đà Lạt ơi, vanh đến đây" },
  { image: "assets/img/memory-24.webp", caption: "chụp khoe tóc thui đó" },
  { image: "assets/img/memory-25.webp", caption: "truyền thuyết ma nữ trong trường học là đây sao" },
  { image: "assets/img/memory-26.webp", caption: "vanh khi ở nhà một mình 👉 make up + chụp hình" },
  { image: "assets/img/memory-27.webp", caption: "kỉ niệm đen mặt do quánh bài thua" },
  { image: "assets/img/memory-28.webp", caption: "vui quá taa" },
  { image: "assets/img/memory-29.webp", caption: "... nhón nhón" },
  { image: "assets/img/memory-30.webp", caption: "nhìn hiền dị thui chứ biết đánh người đấy" },
  { image: "assets/img/memory-31.webp", caption: "tốt nghiệp rùi nè" },
  { image: "assets/img/memory-32.webp", caption: "vẻ đẹp tunhien 💅✨" },
  { image: "assets/img/memory-33.webp", caption: "ờm, em cũng k biết selfie đâu..." },
  { image: "assets/img/memory-34.webp", caption: "hồi nhỏ vanh thích chụp hình" },
  { image: "assets/img/memory-35.webp", caption: "khoe chân dài nè" },
  { image: "assets/img/memory-36.webp", caption: "đừng nhìn tui, tui chảnh lắm đó" },
  { image: "assets/img/memory-37.webp", caption: "quan trọng vẫn là thần thái" },
  { image: "assets/img/memory-38.webp", caption: "ngồi xe vui quá he" },
  { image: "assets/img/memory-39.webp", caption: "sinh nhật ai nèe" }
]

// Fallback image generator khi không tìm thấy ảnh
export function getFallbackImage(index: number): string {
  return `https://picsum.photos/seed/lofi${index + 1}/800/600`
}
