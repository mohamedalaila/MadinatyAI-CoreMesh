import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Roles } from '@madinatyai/common';
import { Public } from '../auth/decorators/public.decorator';
import { MadintyLifeService } from './life.service';
import { LifeLocationType, LifeItemType, LifeBookingType, LifeBookingStatus } from '@prisma/client';

@ApiTags('Madinty Life — Locations')
@Controller('life/locations')
export class MadintyLifeController {
  constructor(private readonly lifeService: MadintyLifeService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List locations filtered by parent, type, or query' })
  list(
    @Query('q') q?: string,
    @Query('parentId') parentId?: string,
    @Query('type') type?: LifeLocationType,
  ) {
    return this.lifeService.listLocations({ q, parentId, type });
  }

  @Public()
  @Get('tree')
  @ApiOperation({ summary: 'Get entire locations hierarchy tree' })
  getTree(@Query('rootId') rootId?: string) {
    const parentId = rootId === 'null' || rootId === '' ? null : rootId || null;
    return this.lifeService.getSubtreeHierarchy(parentId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get single location details including children and breadcrumbs' })
  get(@Param('id') id: string) {
    return this.lifeService.getLocation(id);
  }

  @Post()
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location (Admin only)' })
  create(
    @Body()
    body: {
      name: string;
      nameAr: string;
      description?: string;
      descriptionAr?: string;
      latitude?: number;
      longitude?: number;
      parentId?: string;
      type: LifeLocationType;
      metadata?: any;
    },
  ) {
    return this.lifeService.createLocation(body);
  }

  @Patch(':id')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing location (Admin only)' })
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      nameAr?: string;
      description?: string;
      descriptionAr?: string;
      latitude?: number;
      longitude?: number;
      parentId?: string;
      type?: LifeLocationType;
      metadata?: any;
    },
  ) {
    return this.lifeService.updateLocation(id, body);
  }

  @Delete(':id')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a location and all of its descendants (Admin only)' })
  remove(@Param('id') id: string) {
    return this.lifeService.deleteLocation(id);
  }

  // ── STOREFRONT ITEMS ENDPOINTS ──
  @Public()
  @Get(':id/items')
  @ApiOperation({ summary: 'Get all catalog/menu items for a location' })
  getItems(@Param('id') id: string) {
    return this.lifeService.getItems(id);
  }

  @Post(':id/items')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new catalog/menu item (Admin only)' })
  createItem(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      titleAr?: string;
      description?: string;
      descriptionAr?: string;
      price?: number;
      imageUrl?: string;
      category?: string;
      type: LifeItemType;
      metadata?: any;
    },
  ) {
    return this.lifeService.createItem(id, body);
  }

  @Patch('items/:itemId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing catalog/menu item (Admin only)' })
  updateItem(
    @Param('itemId') itemId: string,
    @Body()
    body: {
      title?: string;
      titleAr?: string;
      description?: string;
      descriptionAr?: string;
      price?: number;
      imageUrl?: string;
      category?: string;
      isAvailable?: boolean;
      type?: LifeItemType;
      metadata?: any;
    },
  ) {
    return this.lifeService.updateItem(itemId, body);
  }

  @Delete('items/:itemId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a catalog/menu item (Admin only)' })
  removeItem(@Param('itemId') itemId: string) {
    return this.lifeService.deleteItem(itemId);
  }

  // ── STOREFRONT BOOKINGS ENDPOINTS ──
  @Get(':id/bookings')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get bookings/orders for a location (Admin only)' })
  getBookings(
    @Param('id') id: string,
    @Query('type') type?: LifeBookingType,
    @Query('status') status?: LifeBookingStatus,
  ) {
    return this.lifeService.getBookings(id, type, status);
  }

  @Public()
  @Post(':id/bookings')
  @ApiOperation({ summary: 'Create a booking/order for a location' })
  createBooking(
    @Param('id') id: string,
    @Body()
    body: {
      customerName: string;
      customerPhone: string;
      dateTime?: string;
      type: LifeBookingType;
      notes?: string;
      metadata?: any;
    },
  ) {
    return this.lifeService.createBooking(id, body);
  }

  @Patch('bookings/:bookingId/status')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update booking status (Admin only)' })
  updateBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() body: { status: LifeBookingStatus },
  ) {
    return this.lifeService.updateBookingStatus(bookingId, body.status);
  }

  // ── STOREFRONT POSTS ENDPOINTS ──
  @Public()
  @Get(':id/posts')
  @ApiOperation({ summary: 'Get all news posts/promotions for a location' })
  getPosts(@Param('id') id: string) {
    return this.lifeService.getPosts(id);
  }

  @Post(':id/posts')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a news post/promotion for a location (Admin only)' })
  createPost(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      content: string;
      imageUrl?: string;
    },
  ) {
    return this.lifeService.createPost(id, body);
  }

  @Delete('posts/:postId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a news post (Admin only)' })
  removePost(@Param('postId') postId: string) {
    return this.lifeService.deletePost(postId);
  }

  // ── STOREFRONT PHOTOS ENDPOINTS ──
  @Public()
  @Get(':id/photos')
  @ApiOperation({ summary: 'Get photo gallery for a location' })
  getPhotos(@Param('id') id: string) {
    return this.lifeService.getPhotos(id);
  }

  @Post(':id/photos')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a photo to gallery (Admin only)' })
  addPhoto(
    @Param('id') id: string,
    @Body()
    body: {
      url: string;
      caption?: string;
      position?: number;
    },
  ) {
    return this.lifeService.addPhoto(id, body);
  }

  @Delete('photos/:photoId')
  @Roles('PLATFORM_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a photo from gallery (Admin only)' })
  removePhoto(@Param('photoId') photoId: string) {
    return this.lifeService.deletePhoto(photoId);
  }
}
