#!/usr/bin/env python3
"""
JSONL Transcript'i Markdown'a Çevir
Kullanım: python3 jsonl_to_md.py <input.jsonl> <output.md>
"""

import json
import sys
from datetime import datetime

def parse_jsonl(filepath):
    """JSONL dosyasını oku ve satırları parse et"""
    messages = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                if line.strip():
                    try:
                        data = json.loads(line)
                        messages.append(data)
                    except json.JSONDecodeError as e:
                        print(f"⚠️  Satır {line_num} parse edilemedi: {e}", file=sys.stderr)
    except FileNotFoundError:
        print(f"❌ Dosya bulunamadı: {filepath}")
        sys.exit(1)
    return messages

def format_markdown(messages):
    """Mesajları Markdown formatında döndür"""
    md = []
    md.append("# Claude Konuşması - Transkript\n")
    md.append(f"**Export Tarihi:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    md.append("---\n\n")

    for i, msg in enumerate(messages, 1):
        # Farklı formatlara uyum sağla
        timestamp = msg.get('timestamp') or msg.get('date') or ''
        role = msg.get('role') or msg.get('type') or 'unknown'
        content = msg.get('content') or msg.get('text') or msg.get('message') or ''

        # Role'ü Türkçeye çevir
        if role in ['user', 'human', 'User']:
            role_label = '**Siz:**'
        elif role in ['assistant', 'ai', 'Claude', 'Assistant']:
            role_label = '**Claude:**'
        else:
            role_label = f'**{role}:**'

        # Timestamp formatla
        timestamp_str = ''
        if timestamp:
            timestamp_str = f" *({timestamp})*"

        # Markdown satırı oluştur
        md.append(f"{i}. {role_label}{timestamp_str}\n")

        if isinstance(content, str):
            # Uzun metinleri kütükle
            if len(content) > 500:
                md.append(f"\n```\n{content}\n```\n")
            else:
                md.append(f"{content}\n")
        elif isinstance(content, dict):
            # Dict ise pretty print
            md.append(f"\n```json\n{json.dumps(content, ensure_ascii=False, indent=2)}\n```\n")
        else:
            md.append(str(content) + "\n")

        md.append("\n---\n\n")

    return ''.join(md)

def main():
    if len(sys.argv) < 2:
        print("Kullanım: python3 jsonl_to_md.py <input.jsonl> [output.md]")
        print("\nÖrnek:")
        print("  python3 jsonl_to_md.py chat.jsonl chat_export.md")
        print("  python3 jsonl_to_md.py ~/.claude/projects/xxx/xxx.jsonl transcript.md")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'transcript_export.md'

    print(f"📖 Okunuyor: {input_file}")
    messages = parse_jsonl(input_file)
    print(f"✅ {len(messages)} mesaj bulundu")

    print(f"🔄 Markdown'a dönüştürülüyor...")
    markdown = format_markdown(messages)

    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown)
        print(f"✅ Kaydedildi: {output_file}")

        # Dosya boyutu göster
        import os
        size = os.path.getsize(output_file) / 1024
        print(f"📊 Dosya boyutu: {size:.1f} KB")
    except IOError as e:
        print(f"❌ Dosya yazılamadı: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
