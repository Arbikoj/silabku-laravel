<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\AbstractPaginator;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */

    public $status;
    public $message;
    public $resource;

    public function __construct($status, $message, $resource)
    {
        parent::__construct($resource);
        $this->status  = $status;
        $this->message = $message;
    }

    public function toArray(Request $request): array
    {
        if ($this->resource instanceof AbstractPaginator) {
            return [
                'success' => $this->status,
                'message' => $this->message,
                'data'    => $this->resource->items(),
                'meta'    => [
                    'current_page' => $this->resource->currentPage(),
                    'last_page'    => $this->resource->lastPage(),
                    'per_page'     => $this->resource->perPage(),
                    'total'        => $this->resource->total(),
                ]
            ];
        }

        return [
            'success' => $this->status,
            'message' => $this->message,
            'data'    => $this->resource
        ];
    }
}
