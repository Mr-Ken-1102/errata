import type { HelpSection } from './help-content'
import { P, Tip } from './help-content.vi-primitives'

export const VI_STORIES_SECTION: HelpSection = {
  id: 'stories',
  title: 'Truyện',
  description: 'Quản lý truyện, ảnh bìa và thư viện truyện của bạn.',
  subsections: [
    {
      id: 'cover-images',
      title: 'Ảnh bìa',
      content: (
        <>
          <P>
            Mỗi truyện có thể có một <strong className="text-foreground/75">ảnh bìa</strong> hiển thị
            trên thẻ truyện trong thư viện và dưới dạng banner ở đầu chế độ xem prose.
          </P>
          <P>Bạn có thể đặt ảnh bìa ở ba nơi:</P>
          <div className="rounded-md border border-border/25 bg-accent/10 px-3 py-2.5 mb-2.5 space-y-0.5">
            {[
              'Hộp thoại Tạo — tải ảnh lên khi tạo truyện mới.',
              'Danh sách truyện — rê chuột lên một thẻ và nhấn biểu tượng camera.',
              'Bảng Thông tin — chuyển sang chế độ chỉnh sửa và dùng trường Ảnh bìa.',
            ].map((item, i) => (
              <p key={item} className="text-[0.71875rem] text-foreground/55 leading-snug">
                <span className="text-muted-foreground mr-1.5">{i + 1}.</span>{item}
              </p>
            ))}
          </div>
          <Tip>
            Ảnh bìa được lưu dưới dạng data URL nên tự chứa hoàn toàn trong dữ liệu truyện.
            Hãy dùng ảnh có kích thước hợp lý để dung lượng file truyện luôn dễ quản lý.
          </Tip>
        </>
      ),
    },
    {
      id: 'gallery',
      title: 'Thư viện truyện',
      content: (
        <>
          <P>
            Trang chủ hiển thị các truyện dưới dạng lưới thẻ dọc tự thích ứng. Truyện có ảnh bìa sẽ dùng ảnh
            làm nền; truyện không có ảnh bìa sẽ nhận một mẫu guilloche riêng — SVG trang trí được tạo
            theo cách xác định từ story ID.
          </P>
          <P>
            Mỗi thẻ hiển thị tên truyện, mô tả, số lượng fragment (prose, character, knowledge,
            guideline) và ngày cập nhật gần nhất. Rê chuột để hiện biểu tượng camera nhằm đặt nhanh
            ảnh bìa, hoặc nút xóa để xóa truyện.
          </P>
        </>
      ),
    },
  ],
}
