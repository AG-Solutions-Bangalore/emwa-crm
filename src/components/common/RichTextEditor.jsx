import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Bold,
  Essentials,
  Italic,
  Paragraph,
  Heading,
  Link,
  List,
  Table,
  TableToolbar,
  BlockQuote,
  GeneralHtmlSupport,
  SourceEditing,
  Alignment,
  Font,
  FontColor,
  FontBackgroundColor,
  FontSize,
  HorizontalLine,
  HtmlEmbed,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'Write content here...',
  minHeight = '220px',
}) {
  return (
    <div
      className="ckeditor-wrapper rounded-xl border border-[#E2DDD5] bg-white overflow-hidden text-[#1A1817] shadow-2xs"
      style={{ '--ck-min-height': minHeight }}
    >
      <CKEditor
        editor={ClassicEditor}
        config={{
          licenseKey: 'GPL',
          placeholder,
          plugins: [
            Essentials,
            Paragraph,
            Heading,
            Bold,
            Italic,
            Link,
            List,
            Table,
            TableToolbar,
            BlockQuote,
            GeneralHtmlSupport,
            SourceEditing,
            Alignment,
            Font,
            FontColor,
            FontBackgroundColor,
            FontSize,
            HorizontalLine,
            HtmlEmbed,
          ],
          toolbar: [
            'undo',
            'redo',
            '|',
            'heading',
            '|',
            'fontSize',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'bold',
            'italic',
            'link',
            '|',
            'alignment',
            'bulletedList',
            'numberedList',
            '|',
            'insertTable',
            'blockQuote',
            'horizontalLine',
            '|',
            'sourceEditing',
          ],
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
          htmlSupport: {
            allow: [
              {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true,
              },
            ],
          },
        }}
        data={value || ''}
        onChange={(event, editor) => {
          const data = editor.getData();
          if (onChange) {
            onChange(data);
          }
        }}
      />
    </div>
  );
}
