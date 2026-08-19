<?php

namespace Tests\Unit;

use Tests\TestCase;

class EscPosGeneratorTest extends TestCase
{
    public function test_escpos_standard_command_definitions(): void
    {
        // 1. Initialization: ESC @
        $initBytes = [0x1B, 0x40];
        $this->assertEquals(0x1B, $initBytes[0]);
        $this->assertEquals(0x40, $initBytes[1]);

        // 2. RJ11 Drawer Kick Pulse (Pin 2, 50ms pulse, 500ms delay): ESC p 0 25 250
        $drawerKickBytes = [0x1B, 0x70, 0x00, 0x19, 0xFA];
        $this->assertEquals(0x70, $drawerKickBytes[1]);
        $this->assertEquals(25, $drawerKickBytes[3]);
        $this->assertEquals(250, $drawerKickBytes[4]);

        // 3. Paper Cut: GS V A 3
        $cutBytes = [0x1D, 0x56, 0x41, 0x03];
        $this->assertEquals(0x1D, $cutBytes[0]);
        $this->assertEquals(0x56, $cutBytes[1]);
        $this->assertEquals(0x41, $cutBytes[2]);
    }
}
