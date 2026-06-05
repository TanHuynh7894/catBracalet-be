import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RemoveRoleDto } from './dto/remove-role.dto';
import { HardDeleteRoleDto } from './dto/hard-delete-role.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Role')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Chỉ Admin mới được quản lý Role
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) { }

  @Post()
  @ApiOperation({ summary: 'Tạo Role mới (Admin)' })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các Role (Admin)' })
  findAll() {
    return this.roleService.findAll();
  }

  @Get(':roleId')
  @ApiOperation({ summary: 'Lấy chi tiết Role theo ID (Admin)' })
  findOne(@Param('roleId') roleId: string) {
    return this.roleService.findOne(roleId);
  }

  @Patch(':roleId')
  @ApiOperation({ summary: 'Cập nhật thông tin Role (Admin)' })
  update(
    @Param('roleId') roleId: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.roleService.update(roleId, updateRoleDto);
  }

  @Delete(':roleId')
  @ApiOperation({ summary: 'Xóa mềm hoặc cập nhật trạng thái Role (Admin)' })
  remove(@Param('roleId') roleId: string, @Query() removeRoleDto: RemoveRoleDto) {
    return this.roleService.remove(roleId, removeRoleDto.status);
  }

  @Delete(':roleId/hard')
  @ApiOperation({ summary: 'Xóa cứng Role vĩnh viễn khỏi Database (Admin)' })
  hardRemove(
    @Param('roleId') roleId: string,
    @Body() hardDeleteRoleDto: HardDeleteRoleDto,
  ) {
    return this.roleService.hardDelete(roleId);
  }
}
