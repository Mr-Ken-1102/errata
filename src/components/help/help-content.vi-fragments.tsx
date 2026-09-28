import type { HelpSection } from './help-content'
import { Mono, P, Tip } from './help-content.vi-primitives'

export const VI_FRAGMENTS_SECTION: HelpSection = {
  id: 'fragments',
  title: 'Fragment',
  description: 'Mọi nội dung trong Errata đều là fragment. Tìm hiểu cách chúng kết hợp để tạo nên truyện của bạn.',
  subsections: [
    {
      id: 'overview',
      title: 'Fragment là gì',
      content: (
        <>
          <P>
            Fragment là các khối xây dựng nên truyện của bạn. Mọi phần nội dung — đoạn văn xuôi,
            hồ sơ nhân vật, kiến thức thế giới, hướng dẫn viết — đều được lưu dưới dạng fragment
            với ID, tên, mô tả và phần nội dung riêng.
          </P>
          <P>
            ID fragment dùng mẫu ngắn, dễ đọc: prefix loại gồm 2 ký tự, theo sau bởi 4–8 ký tự.
            Ví dụ: <Mono>pr-katemi</Mono> cho prose, <Mono>ch-bokura</Mono> cho character,
            <Mono>gl-sideno</Mono> cho guideline và <Mono>kn-taviku</Mono> cho knowledge.
          </P>
        </>
      ),
    },
    {
      id: 'types',
      title: 'Các loại fragment',
      content: (
        <>
          <P>
            <strong className="text-foreground/75">Prose</strong> — chính là câu chuyện. Các prose fragment
            tạo thành một chain (chuỗi có thứ tự) đại diện cho mạch kể. Mỗi lần tạo nội dung sẽ nối thêm
            một prose fragment mới vào chain.
          </P>
          <P>
            <strong className="text-foreground/75">Characters</strong> — hồ sơ nhân vật, quá khứ và mô tả
            tính cách. Character sticky luôn hiển thị đầy đủ cho mô hình; character non-sticky xuất hiện
            dưới dạng dòng danh mục để mô hình có thể tra cứu.
          </P>
          <P>
            <strong className="text-foreground/75">Guidelines</strong> — hướng dẫn phong cách viết, giọng điệu,
            quy ước thể loại và các quy tắc mô hình cần tuân theo. Có thể xem đây là các chỉ dẫn viết bền vững.
          </P>
          <P>
            <strong className="text-foreground/75">Knowledge</strong> — chi tiết xây dựng thế giới, lore,
            timeline, hệ thống phép thuật, địa lý và mọi thông tin tham chiếu mà mô hình có thể tra cứu.
          </P>
        </>
      ),
    },
    {
      id: 'sticky',
      title: 'Sticky và non-sticky',
      content: (
        <>
          <P>
            <strong className="text-foreground/75">Sticky fragment</strong> được đưa đầy đủ vào mọi prompt
            tạo nội dung. Mô hình luôn nhìn thấy toàn bộ nội dung của chúng. Hãy dùng cho guideline quan trọng,
            nhân vật chính hoặc chi tiết thế giới thiết yếu.
          </P>
          <P>
            <strong className="text-foreground/75">Non-sticky fragment</strong> chỉ xuất hiện dưới dạng
            một dòng trong catalog (ID, tên, mô tả). Mô hình có thể dùng công cụ để đọc toàn bộ nội dung
            khi cần. Cách này giữ prompt tập trung mà thông tin vẫn có thể được truy cập.
          </P>
          <Tip>
            Chỉ giữ những fragment quan trọng nhất ở trạng thái sticky. Quá nhiều sticky fragment làm prompt
            phình to và có thể làm loãng sự chú ý của mô hình. Hãy để mô hình tự tra cứu các chi tiết phụ bằng công cụ.
          </Tip>
        </>
      ),
    },
    {
      id: 'export-import',
      title: 'Xuất và nhập',
      content: (
        <>
          <P>
            Fragment pack cho phép chia sẻ character, guideline và knowledge giữa các truyện hoặc với người dùng khác.
            Xuất từ bảng export trong sidebar và nhập qua hộp thoại import.
          </P>
          <P>
            Pack được xuất chứa đầy đủ dữ liệu fragment — nội dung, tag, placement, order, metadata và ảnh đính kèm.
            ID fragment được giữ khi nhập nếu có thể; nếu một ID xung đột với fragment đã tồn tại,
            ID mới sẽ được tạo tự động.
          </P>
          <P>
            Bạn có thể tùy chọn kèm <strong className="text-foreground/75">context configuration</strong>{' '}
            trong gói xuất — custom block, block override và cấu hình block theo từng agent. Khi nhập,
            checkbox theo từng phần cho phép chọn cấu hình nào sẽ được áp dụng. Cấu hình được nhập sẽ thay thế
            cấu hình hiện có của chính phần đó.
          </P>
          <Tip>
            Vì ID fragment có thể thay đổi khi nhập, hãy dùng tag trong script block thay vì hardcode ID.
            Ví dụ, gắn tag "world-rules" cho một fragment rồi dùng <Mono>ctx.getFragmentByTag('world-rules')</Mono>{' '}
            trong script của custom block.
          </Tip>
        </>
      ),
    },
    {
      id: 'tags-refs',
      title: 'Tag và reference',
      content: (
        <>
          <P>
            <strong className="text-foreground/75">Tags</strong> là nhãn tự do để tổ chức fragment.
            Dùng chúng để lọc và tìm kiếm. Tag được giữ khi xuất/nhập fragment pack, nên đây là cách đáng tin cậy
            để tham chiếu fragment trong script block — dùng <Mono>ctx.getFragmentByTag(tag)</Mono> thay vì
            hardcode ID, vì ID có thể thay đổi khi nhập.
          </P>
          <P>
            <strong className="text-foreground/75">References</strong> liên kết một fragment với fragment khác
            bằng ID. Khi mô hình tra cứu một fragment, nó có thể thấy những fragment liên quan và lần theo
            chuỗi reference.
          </P>
        </>
      ),
    },
  ],
}
