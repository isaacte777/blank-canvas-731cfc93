<?php

namespace Dashboard\Controller\Service;

use Dashboard\Acl\AclPermissionEnum;
use Dashboard\Controller\StandardCRUD;
use Klein\Request;
use Propel\Campaign;
use Propel\Runtime\Map\TableMap;

class CampaignsController extends StandardCRUD
{
    protected array  $replacing_filters = [
        "DRAFT", "PENDING", "ACTIVE"
    ];

    public function run(): void
    {
        parent::run();

        $this->setupCrud(AclPermissionEnum::CAMPAIGNS, Campaign::class);
    }

    public function getListDatatable(Request $request) {

        $query = call_user_func([$this->getQueryClassName(), "create"]);
        //$this->__sortList($query);

        $pagination = $request->paramsGet()->get('pagination');
        $pageGet = is_null($pagination) ? 10 : $pagination['page'];
        $itemsGet = is_null($pagination) ? 10 : $pagination['perpage'];
        $filters = $request->paramsGet()->get('query');
        $sort_by = $request->paramsGet()->get('sort_by');
        $sort_order = $request->paramsGet()->get('sort_order');

        $page = is_null($pageGet) ? 1 : $pageGet;
        $items = is_null($itemsGet) ? 20 : $itemsGet;

        if(!is_null($filters)){
            foreach ($filters as $item => $value){
                if(!in_array($value, $this->blacklist_filters)){
                    if(in_array($value, $this->replacing_filters)){
                        $value = array_search($value, $this->replacing_filters);
                    }

                    if (str_starts_with($value, '%') && str_ends_with($value, '%')){
                        $query->where(sprintf('%s.%s LIKE ?', $this->base_class, $item), $value);
                    }else{
                        $query->filterBy($item, $value);
                    }
                }
            }
        }

        if(!is_null($sort_by) && $sort_by !== '' && !is_null($sort_order) && $sort_order !== ''){
            $query->orderBy($sort_by, $sort_order);
        }

        $query->leftJoinWithBrand();

        $models = $query->paginate($page, $items);

        $this->response_table([
            "data" => $models->toArray(null, false, TableMap::TYPE_PHPNAME, true, []),
            "meta" => [
                "field"     => "Id",
                "page"      => $page,
                "pages"     => $models->getLastPage(),
                "perpage"   => $items,
                "sort"      => "asc",
                "total"     => $models->getNbResults()
            ]
        ]);
    }

}