// Utility functions for client-side export of minutes to Excel and Word

// Function to create Excel export using simple HTML table
export const exportToExcel = (minutesData) => {
  try {
    // Create HTML table structure
    let htmlContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Biên bản cuộc họp</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            h1, h2 { color: #333; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-table { width: 60%; margin-bottom: 20px; }
            .info-table td:first-child { font-weight: bold; width: 30%; }
            .vote-table { margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BIÊN BẢN CUỘC HỌP</h1>
          </div>
          
          <!-- Thông tin cơ bản -->
          <table class="info-table">
            <tr><td>Tiêu đề cuộc họp:</td><td>${minutesData.meetingTitle}</td></tr>
            <tr><td>Thời gian:</td><td>${minutesData.meetingTime}</td></tr>
            <tr><td>Địa điểm:</td><td>${minutesData.location}</td></tr>
            <tr><td>Thư ký:</td><td>${minutesData.secretary}</td></tr>
          </table>
          
          <!-- Nội dung biên bản -->
          <h2>NỘI DUNG BIÊN BẢN</h2>
          <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; background: #fafafa;">
            ${minutesData.content.split('\n').map(line => `<p>${line || '&nbsp;'}</p>`).join('')}
          </div>
    `;

    // Thêm quyết định nếu có
    if (minutesData.decisions && minutesData.decisions.length > 0) {
      htmlContent += `
        <h2>CÁC QUYẾT ĐỊNH</h2>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tiêu đề</th>
              <th>Mô tả</th>
              <th>Người chịu trách nhiệm</th>
              <th>Hạn chót</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      minutesData.decisions.forEach((decision, index) => {
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${decision.title}</td>
            <td>${decision.description || ''}</td>
            <td>${decision.responsible || ''}</td>
            <td>${decision.deadline || ''}</td>
            <td>${decision.status}</td>
          </tr>
        `;
      });
      
      htmlContent += `</tbody></table>`;
    }

    // Thống kê bỏ phiếu
    htmlContent += `
      <h2>KẾT QUẢ BỎ PHIẾU</h2>
      <table class="info-table">
        <tr><td>Tổng số người cần bỏ phiếu:</td><td>${minutesData.statistics.totalRequired}</td></tr>
        <tr><td>Số người đã bỏ phiếu:</td><td>${minutesData.statistics.totalReceived}</td></tr>
        <tr><td>Đồng ý:</td><td>${minutesData.statistics.agreeCount}</td></tr>
        <tr><td>Đồng ý có ý kiến:</td><td>${minutesData.statistics.agreeWithCommentsCount}</td></tr>
        <tr><td>Không đồng ý:</td><td>${minutesData.statistics.disagreeCount}</td></tr>
        <tr><td>Tỷ lệ đồng ý:</td><td>${minutesData.statistics.agreementRate}%</td></tr>
        <tr><td>Tỷ lệ tham gia:</td><td>${minutesData.statistics.participationRate}%</td></tr>
      </table>
    `;

    // Chi tiết bỏ phiếu
    if (minutesData.votes && minutesData.votes.length > 0) {
      htmlContent += `
        <h2>CHI TIẾT BỎ PHIẾU</h2>
        <table class="vote-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Họ tên</th>
              <th>Phòng ban</th>
              <th>Chức vụ</th>
              <th>Lựa chọn</th>
              <th>Ý kiến</th>
              <th>Thời gian bỏ phiếu</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      minutesData.votes.forEach((vote, index) => {
        htmlContent += `
          <tr>
            <td>${index + 1}</td>
            <td>${vote.userName}</td>
            <td>${vote.department}</td>
            <td>${vote.position}</td>
            <td>${vote.voteType}</td>
            <td>${vote.comment}</td>
            <td>${vote.votedAt}</td>
          </tr>
        `;
      });
      
      htmlContent += `</tbody></table>`;
    }

    // Thông tin phê duyệt
    if (minutesData.approval.isApproved) {
      htmlContent += `
        <h2>THÔNG TIN PHÊ DUYỆT</h2>
        <table class="info-table">
          <tr><td>Được phê duyệt bởi:</td><td>${minutesData.approval.approvedBy}</td></tr>
          <tr><td>Thời gian phê duyệt:</td><td>${minutesData.approval.approvedAt}</td></tr>
        </table>
      `;
    }

    // Footer
    htmlContent += `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666;">
            <p>Biên bản được xuất tự động vào ${minutesData.exportedAt} bởi ${minutesData.exportedBy}</p>
          </div>
        </body>
      </html>
    `;

    // Tạo và download file
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const fileName = `bien-ban-${minutesData.meetingTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.xls`;
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to create Word export as HTML document
export const exportToWord = (minutesData) => {
  try {
    // Create Word-compatible HTML content
    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:w="urn:schemas-microsoft-com:office:word"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>Biên bản cuộc họp</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4;
              margin: 2cm;
            }
            body {
              font-family: 'Times New Roman', serif;
              font-size: 14pt;
              line-height: 1.5;
              margin: 0;
              color: #000;
            }
            h1 {
              text-align: center;
              font-size: 18pt;
              font-weight: bold;
              margin: 20pt 0;
              text-transform: uppercase;
            }
            h2 {
              font-size: 16pt;
              font-weight: bold;
              margin: 15pt 0 10pt 0;
              color: #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10pt 0;
            }
            th, td {
              border: 1px solid #000;
              padding: 8pt;
              vertical-align: top;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            .info-row td:first-child {
              font-weight: bold;
              width: 25%;
            }
            .content-box {
              border: 1px solid #000;
              padding: 12pt;
              margin: 10pt 0;
              background-color: #fafafa;
            }
            .footer {
              margin-top: 30pt;
              padding-top: 15pt;
              border-top: 1px solid #000;
              font-size: 12pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>BIÊN BẢN CUỘC HỌP</h1>
          
          <!-- Thông tin cơ bản -->
          <table>
            <tr class="info-row"><td>Tiêu đề cuộc họp:</td><td>${minutesData.meetingTitle}</td></tr>
            <tr class="info-row"><td>Thời gian:</td><td>${minutesData.meetingTime}</td></tr>
            <tr class="info-row"><td>Địa điểm:</td><td>${minutesData.location}</td></tr>
            <tr class="info-row"><td>Thư ký:</td><td>${minutesData.secretary}</td></tr>
          </table>
          
          <!-- Nội dung biên bản -->
          <h2>I. NỘI DUNG BIÊN BẢN</h2>
          <div class="content-box">
            ${minutesData.content.split('\n').map(line => `<p style="margin: 6pt 0;">${line || '&nbsp;'}</p>`).join('')}
          </div>
    `;

    // Thêm quyết định nếu có
    if (minutesData.decisions && minutesData.decisions.length > 0) {
      htmlContent += `
        <h2>II. CÁC QUYẾT ĐỊNH</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">STT</th>
              <th style="width: 25%;">Tiêu đề</th>
              <th style="width: 30%;">Mô tả</th>
              <th style="width: 15%;">Người chịu trách nhiệm</th>
              <th style="width: 12%;">Hạn chót</th>
              <th style="width: 10%;">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      minutesData.decisions.forEach((decision, index) => {
        htmlContent += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${decision.title}</td>
            <td>${decision.description || ''}</td>
            <td>${decision.responsible || ''}</td>
            <td>${decision.deadline || ''}</td>
            <td>${decision.status}</td>
          </tr>
        `;
      });
      
      htmlContent += `</tbody></table>`;
    }

    // Thống kê bỏ phiếu
    const sectionNumber = minutesData.decisions && minutesData.decisions.length > 0 ? 'III' : 'II';
    htmlContent += `
      <h2>${sectionNumber}. KẾT QUẢ BỎ PHIẾU</h2>
      <table>
        <tr class="info-row"><td>Tổng số người cần bỏ phiếu:</td><td>${minutesData.statistics.totalRequired}</td></tr>
        <tr class="info-row"><td>Số người đã bỏ phiếu:</td><td>${minutesData.statistics.totalReceived}</td></tr>
        <tr class="info-row"><td>Đồng ý:</td><td>${minutesData.statistics.agreeCount}</td></tr>
        <tr class="info-row"><td>Đồng ý có ý kiến:</td><td>${minutesData.statistics.agreeWithCommentsCount}</td></tr>
        <tr class="info-row"><td>Không đồng ý:</td><td>${minutesData.statistics.disagreeCount}</td></tr>
        <tr class="info-row"><td>Tỷ lệ đồng ý:</td><td>${minutesData.statistics.agreementRate}%</td></tr>
        <tr class="info-row"><td>Tỷ lệ tham gia:</td><td>${minutesData.statistics.participationRate}%</td></tr>
      </table>
    `;

    // Chi tiết bỏ phiếu
    if (minutesData.votes && minutesData.votes.length > 0) {
      const detailSection = minutesData.decisions && minutesData.decisions.length > 0 ? 'IV' : 'III';
      htmlContent += `
        <h2>${detailSection}. CHI TIẾT BỎ PHIẾU</h2>
        <table>
          <thead>
            <tr>
              <th style="width: 8%;">STT</th>
              <th style="width: 20%;">Họ tên</th>
              <th style="width: 15%;">Phòng ban</th>
              <th style="width: 12%;">Chức vụ</th>
              <th style="width: 15%;">Lựa chọn</th>
              <th style="width: 20%;">Ý kiến</th>
              <th style="width: 10%;">Thời gian</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      minutesData.votes.forEach((vote, index) => {
        htmlContent += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>${vote.userName}</td>
            <td>${vote.department}</td>
            <td>${vote.position}</td>
            <td>${vote.voteType}</td>
            <td>${vote.comment}</td>
            <td style="font-size: 10pt;">${vote.votedAt}</td>
          </tr>
        `;
      });
      
      htmlContent += `</tbody></table>`;
    }

    // Thông tin phê duyệt
    if (minutesData.approval.isApproved) {
      htmlContent += `
        <h2>THÔNG TIN PHÊ DUYỆT</h2>
        <table>
          <tr class="info-row"><td>Được phê duyệt bởi:</td><td>${minutesData.approval.approvedBy}</td></tr>
          <tr class="info-row"><td>Thời gian phê duyệt:</td><td>${minutesData.approval.approvedAt}</td></tr>
        </table>
      `;
    }

    // Footer
    htmlContent += `
          <div class="footer">
            <p>Biên bản được xuất tự động vào ${minutesData.exportedAt} bởi ${minutesData.exportedBy}</p>
          </div>
        </body>
      </html>
    `;

    // Tạo và download file
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
    const fileName = `bien-ban-${minutesData.meetingTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.doc`;
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Function to export as simple text file
export const exportToText = (minutesData) => {
  try {
    let content = `BIÊN BẢN CUỘC HỌP\n`;
    content += `${'='.repeat(50)}\n\n`;
    
    // Thông tin cơ bản
    content += `Tiêu đề cuộc họp: ${minutesData.meetingTitle}\n`;
    content += `Thời gian: ${minutesData.meetingTime}\n`;
    content += `Địa điểm: ${minutesData.location}\n`;
    content += `Thư ký: ${minutesData.secretary}\n\n`;
    
    // Nội dung biên bản
    content += `I. NỘI DUNG BIÊN BẢN\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `${minutesData.content}\n\n`;
    
    // Quyết định
    if (minutesData.decisions && minutesData.decisions.length > 0) {
      content += `II. CÁC QUYẾT ĐỊNH\n`;
      content += `${'-'.repeat(30)}\n`;
      minutesData.decisions.forEach((decision, index) => {
        content += `${index + 1}. ${decision.title}\n`;
        if (decision.description) content += `   Mô tả: ${decision.description}\n`;
        if (decision.responsible) content += `   Người chịu trách nhiệm: ${decision.responsible}\n`;
        if (decision.deadline) content += `   Hạn chót: ${decision.deadline}\n`;
        content += `   Trạng thái: ${decision.status}\n\n`;
      });
    }
    
    // Kết quả bỏ phiếu
    const voteSection = minutesData.decisions && minutesData.decisions.length > 0 ? 'III' : 'II';
    content += `${voteSection}. KẾT QUẢ BỎ PHIẾU\n`;
    content += `${'-'.repeat(30)}\n`;
    content += `Tổng số người cần bỏ phiếu: ${minutesData.statistics.totalRequired}\n`;
    content += `Số người đã bỏ phiếu: ${minutesData.statistics.totalReceived}\n`;
    content += `Đồng ý: ${minutesData.statistics.agreeCount}\n`;
    content += `Đồng ý có ý kiến: ${minutesData.statistics.agreeWithCommentsCount}\n`;
    content += `Không đồng ý: ${minutesData.statistics.disagreeCount}\n`;
    content += `Tỷ lệ đồng ý: ${minutesData.statistics.agreementRate}%\n`;
    content += `Tỷ lệ tham gia: ${minutesData.statistics.participationRate}%\n\n`;
    
    // Chi tiết bỏ phiếu
    if (minutesData.votes && minutesData.votes.length > 0) {
      const detailSection = minutesData.decisions && minutesData.decisions.length > 0 ? 'IV' : 'III';
      content += `${detailSection}. CHI TIẾT BỎ PHIẾU\n`;
      content += `${'-'.repeat(30)}\n`;
      minutesData.votes.forEach((vote, index) => {
        content += `${index + 1}. ${vote.userName} (${vote.department}) - ${vote.voteType}\n`;
        if (vote.comment) content += `   Ý kiến: ${vote.comment}\n`;
        content += `   Thời gian: ${vote.votedAt}\n\n`;
      });
    }
    
    // Thông tin phê duyệt
    if (minutesData.approval.isApproved) {
      content += `THÔNG TIN PHÊ DUYỆT\n`;
      content += `${'-'.repeat(30)}\n`;
      content += `Được phê duyệt bởi: ${minutesData.approval.approvedBy}\n`;
      content += `Thời gian phê duyệt: ${minutesData.approval.approvedAt}\n\n`;
    }
    
    // Footer
    content += `${'-'.repeat(50)}\n`;
    content += `Biên bản được xuất tự động vào ${minutesData.exportedAt} bởi ${minutesData.exportedBy}\n`;

    // Tạo và download file
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const fileName = `bien-ban-${minutesData.meetingTitle.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.txt`;
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (error) {
    return { success: false, error: error.message };
  }
}; 