<?php

namespace Dashboard\Controller;

use Exception;
use Klein\Request;
use Klein\Response;
use Propel\Runtime\Map\TableMap;
use Propel\Runtime\ActiveRecord\ActiveRecordInterface;

class StandardCRUD extends LoggedController
{

    protected string $permission;
    protected string $base_class;

    protected array  $blacklist_filters = [
        "all", "", "0"
    ];
    protected array  $replacing_filters = [
        "ENABLED", "DISABLED"
    ];

    public function setupCrud(string $permission, string $base_class) {
        $this->permission = $permission;
        $this->base_class = $base_class;

        $this->respond("get", $this->relativeRoute("/?"), [$this, "getList"]);
        $this->respond("put", $this->relativeRoute(), [$this, "saveNew"]);
        $this->respond("get", $this->relativeRoute("/[:id]"), [$this, "getOne"]);
        $this->respond("post", $this->relativeRoute("/[:id]"), [$this, "update"]);
        $this->respond("delete", $this->relativeRoute("/[:id]"), [$this, "delete"]);
    }

    public function getList(Request $request, Response $response) {
        $this->canRead($this->permission);
        $dt = $request->paramsGet()->get('ktdatatable');
        if(is_null($dt)){
            $models = $this->__getList($request);
            $this->sendResponse(true, $models->toArray(null, false, TableMap::TYPE_PHPNAME, false, []));
        }else{
            $this->getListDatatable($request);
        }
    }

    protected function __sortList($queryObject) {
        return $queryObject;
    }

    public function saveNew() {
        $model = $this->_saveNew();

        $this->sendResponse(true, $model->toArray());
    }

    protected function getQueryClassName(): string {
        return sprintf("%sQuery", $this->base_class);
    }

    public function update($request) {
        $this->canWrite($this->permission);
        $body = $this->getRequestBody(true);

        $model = $this->__getOne($request->id);
        $model->fromArray($body);
        $model->save();

        $this->sendResponse(true, $model->toArray());
    }

    protected function __getOne($id) {
        $class = $this->getQueryClassName();
        $query = call_user_func([$class, "create"]);
        return $query->findOneById($id);
    }

    public function getOne($request) {
        $this->canRead($this->permission);

        $model = $this->__getOne($request->id);

        $this->sendResponse(true, $model->toArray());
    }

    public function delete($request) {
        $this->canWrite($this->permission);

        $model = $this->__getOne($request->id);

        if (!$this->canDelete($model)) {
            throw new Exception("Cannot delete this object");
        }

        $model->delete();
        $this->sendResponse(true, "ok");
    }

    protected function __getList(Request $request) {
        $query = call_user_func([$this->getQueryClassName(), "create"]);
        $this->__sortList($query);
        $filters = $request->paramsGet()->get('query');
        if(!is_null($filters)){
            foreach ($filters as $item => $value){
                if(!in_array($value, $this->blacklist_filters)){
                    if(in_array($value, $this->replacing_filters)){
                        $value = array_search($value, $this->replacing_filters);
                    }

                    if(is_array($value)){
                        $query->filterBy($item, $value);
                    }else if (str_starts_with($value, '%') && str_ends_with($value, '%')){
                        $query->where(sprintf('%s.%s LIKE ?', $this->base_class, $item), $value);
                    }else{
                        $query->filterBy($item, $value);
                    }
                }
            }
        }
        return $query->find();
    }

    protected function canDelete($model) {
        return true;
    }

    /**
     * @return mixed
     */
    protected function _saveNew(): ActiveRecordInterface {
        $this->canWrite($this->permission);
        $body = $this->getRequestBody(true);

        $class_name = $this->base_class;

        $model = new $class_name();
        $model->fromArray($body);
        $model->save();
        return $model;
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

        $models = $query->paginate($page, $items);

        $this->response_table([
            "data" => $models->toArray(),
            "meta" => [
                "field"     => "IntId",
                "page"      => $page,
                "pages"     => $models->getLastPage(),
                "perpage"   => $items,
                "sort"      => "asc",
                "total"     => $models->getNbResults()
            ]
        ]);
    }
}