/**
 * ESC/POS Thermal Printer & Cash Drawer Command Generator
 * Supports 58mm (32 chars) and 80mm (42/48 chars) thermal printers
 * Compatible with WebSerial, WebUSB, and Raw Network sockets
 */

export interface ReceiptItemModifier {
  name: string;
  price_adjustment?: number;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  modifiers?: ReceiptItemModifier[];
}

export interface ReceiptData {
  companyName: string;
  branchName: string;
  kioskCode: string;
  kioskName: string;
  orderNumber: string;
  orderedAt: string;
  items: ReceiptItem[];
  subtotal: number;
  taxAmount: number;
  netAmount: number;
  paymentMethod: string;
  cashTendered?: number;
  changeDue?: number;
  footerMessage?: string;
  paperWidth?: '58mm' | '80mm';
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private charWidth: number = 32; // Default for 58mm (32 chars), 80mm is 42-48 chars

  constructor(paperWidth: '58mm' | '80mm' = '58mm') {
    this.charWidth = paperWidth === '80mm' ? 42 : 32;
    this.init();
  }

  /**
   * ESC @ - Initialize printer
   */
  public init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  /**
   * ESC p m t1 t2 - Generate RJ11 Cash Drawer Kick pulse
   * Pin 2: m=0, t1=25 (50ms pulse), t2=250 (500ms delay)
   */
  public kickDrawer(pin: 2 | 5 = 2): this {
    const pinVal = pin === 2 ? 0x00 : 0x01;
    this.buffer.push(0x1b, 0x70, pinVal, 0x19, 0xfa);
    return this;
  }

  /**
   * Text Alignment: 'LEFT' | 'CENTER' | 'RIGHT'
   * ESC a n (0=left, 1=center, 2=right)
   */
  public align(alignment: 'LEFT' | 'CENTER' | 'RIGHT'): this {
    const n = alignment === 'LEFT' ? 0x00 : alignment === 'CENTER' ? 0x01 : 0x02;
    this.buffer.push(0x1b, 0x61, n);
    return this;
  }

  /**
   * ESC E n - Bold text on/off
   */
  public bold(enable: boolean = true): this {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  /**
   * GS ! n - Double height / width
   */
  public textDouble(enable: boolean = true): this {
    this.buffer.push(0x1d, 0x21, enable ? 0x11 : 0x00); // 0x11 = double height & double width
    return this;
  }

  /**
   * Append raw text encoded as ASCII / CP437
   */
  public text(str: string): this {
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      this.buffer.push(code <= 0x7f ? code : 0x3f); // replace non-ascii with '?'
    }
    return this;
  }

  /**
   * Text line with LF (\n)
   */
  public textLine(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0a); // LF
    return this;
  }

  /**
   * Print a horizontal divider line based on paper width
   */
  public divider(char: string = '-'): this {
    this.textLine(char.repeat(this.charWidth));
    return this;
  }

  /**
   * Print 2-column aligned row (Left text, Right text)
   * e.g., "Subtotal", "RM 24.00"
   */
  public row2(left: string, right: string): this {
    const spaceCount = this.charWidth - (left.length + right.length);
    if (spaceCount < 1) {
      const maxLeft = this.charWidth - right.length - 1;
      const truncatedLeft = left.substring(0, maxLeft);
      this.textLine(`${truncatedLeft} ${right}`);
    } else {
      this.textLine(`${left}${' '.repeat(spaceCount)}${right}`);
    }
    return this;
  }

  /**
   * Feed lines & Cut Paper
   * GS V A n (Cut with feed)
   */
  public cut(feedLines: number = 3): this {
    for (let i = 0; i < feedLines; i++) {
      this.buffer.push(0x0a);
    }
    this.buffer.push(0x1d, 0x56, 0x41, 0x03); // Full cut
    return this;
  }

  /**
   * Return Uint8Array binary byte payload
   */
  public getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /**
   * Build complete standard receipt ESC/POS payload
   */
  public static buildReceipt(data: ReceiptData, autoKickDrawer: boolean = true): Uint8Array {
    const builder = new EscPosBuilder(data.paperWidth || '58mm');

    // 1. Optional Cash Drawer Kick Pulse at start of receipt
    if (autoKickDrawer && data.paymentMethod === 'CASH') {
      builder.kickDrawer(2);
    }

    // 2. Header
    builder
      .align('CENTER')
      .bold(true)
      .textDouble(true)
      .textLine(data.companyName.toUpperCase())
      .textDouble(false)
      .bold(false)
      .textLine(data.branchName)
      .textLine(`Kiosk: ${data.kioskCode} (${data.kioskName})`)
      .divider('=')
      .bold(true)
      .textLine(data.orderNumber)
      .bold(false)
      .textLine(data.orderedAt)
      .divider('-');

    // 3. Items
    builder.align('LEFT');
    data.items.forEach((item) => {
      const lineTotal = (item.unit_price * item.quantity).toFixed(2);
      const itemTitle = `${item.quantity}x ${item.name}`;
      builder.bold(true).row2(itemTitle, `RM ${lineTotal}`).bold(false);

      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach((mod) => {
          const modPrice = mod.price_adjustment && mod.price_adjustment > 0 ? ` (+RM ${mod.price_adjustment.toFixed(2)})` : '';
          builder.textLine(`  + ${mod.name}${modPrice}`);
        });
      }
    });

    // 4. Financial Summary
    builder
      .divider('-')
      .row2('Subtotal:', `RM ${data.subtotal.toFixed(2)}`)
      .row2('SST Tax (6%):', `RM ${data.taxAmount.toFixed(2)}`)
      .bold(true)
      .row2('TOTAL AMOUNT:', `RM ${data.netAmount.toFixed(2)}`)
      .bold(false)
      .divider('-')
      .row2(`Payment Method:`, data.paymentMethod);

    if (data.paymentMethod === 'CASH' && data.cashTendered !== undefined) {
      builder.row2('Cash Tendered:', `RM ${data.cashTendered.toFixed(2)}`);
      if (data.changeDue !== undefined && data.changeDue > 0) {
        builder.bold(true).row2('CHANGE DUE:', `RM ${data.changeDue.toFixed(2)}`).bold(false);
      }
    }

    // 5. Footer & Automated BOM Notice
    builder
      .divider('=')
      .align('CENTER')
      .textLine('Automated BOM Recipe Deducted')
      .textLine(data.footerMessage || 'Thank you for your visit!')
      .textLine('Please come again')
      .cut(3);

    return builder.getBytes();
  }
}

/**
 * WebSerial Hardware Driver
 * Communicates directly with USB/Serial ESC/POS printers via navigator.serial
 */
export class WebSerialPrinter {
  private port: any = null;

  public async connect(baudRate: number = 9600): Promise<boolean> {
    if (!('serial' in navigator)) {
      throw new Error('WebSerial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    try {
      this.port = await (navigator as any).serial.requestPort();
      await this.port.open({ baudRate });
      return true;
    } catch (err: any) {
      console.error('Serial connection error:', err);
      throw err;
    }
  }

  public async print(data: Uint8Array): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error('Serial printer is not connected. Please pair printer first.');
    }

    const writer = this.port.writable.getWriter();
    try {
      await writer.write(data);
    } finally {
      writer.releaseLock();
    }
  }

  public async kickDrawerOnly(): Promise<void> {
    const builder = new EscPosBuilder();
    builder.kickDrawer(2).kickDrawer(5);
    await this.print(builder.getBytes());
  }

  public async close(): Promise<void> {
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }
}
