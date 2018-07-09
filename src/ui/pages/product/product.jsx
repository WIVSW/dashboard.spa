import React from 'react';
import Page from '../base';
import Table from '../../blocks/table/table.jsx';
import TableModel from '../../models/table';
import Autocomplete from '../../blocks/autocomplete/autocomplete.jsx';
import IngredientModel from "../../models/ingredient";

class Product extends Page {
	constructor(props) {
		super(props);
	}

	preload() {
		const { id } = this.props.match.params;
		return Promise
			.all([
				this.props.ingredientApi.read(),
				this.props.productApi.getByIds([ id ])
			])
			.then((data) => {
				this._allIngredients = data[0];
				this._product = data[1] &&
					(data[1].length && data[1][0]) || null;

				this._ingredients = this._product ?
					this._product.ingredients.map(
						(item) => {
							const found = this._allIngredients.find((ingredient) => ingredient._id === item.id);
							found.count = item.count;
							return found;
						}
					) :
					[];

				const table = new TableModel(this._parseTable(this._ingredients).table);

				return { table };
			})
	}

	getTemplate() {
		return (
			<div>
				<h1 style={{padding: '15px 30px'}}>{this._product.name}</h1>
				<Autocomplete
					onAdd={(product) => this._onInputNew(product)}
					source={this._allIngredients}
					ignore={this._product.ingredients.map((ingredient) => ingredient.id)}
				/>
				<Table
					table={this.state.table}
					showAddBtn={false}

					onRowDelete={(id) => this._delete(id)}
					onSave={(changes) => this._onSave(changes)}
				/>
			</div>
		);
	}

	_parseTable(data) {
		if (!data.length) {
			return {
				table: {
					head: ['Name', 'Supplier', 'Count', 'Prime cost'],
					body: []
				}
			}
		}

		const table = {
			head: []
		};

		table.body = data.map((row) => this._parseRow(row, table.head));

		return { table };
	}

	_parseRow(ingredient, tableHead) {
		const row = { id: ingredient._id, cells: [] };

		const setHead = (head) => {
			if (!tableHead.includes(head))
				tableHead.push(head);
		};

		const defaultComponent = (data) =>
			<span
				contentEditable={data.contentEditable}
				onInput={(e) => data.onInput(e)}
				suppressContentEditableWarning
			>
					{data.children}
				</span>;

		setHead('Name');

		row.cells.push({
			'id': ingredient._id,
			'key': 'Name',
			'name': 'name',
			'value': ingredient.name,
			'component': defaultComponent,
			'initValue': ingredient.name,
			'editable': true,
			'changed': false
		});

		setHead('Supplier');

		row.cells.push({
			'id': ingredient._id,
			'key': 'Supplier',
			'name': 'supplier',
			'value': ingredient.supplier,
			'component': defaultComponent,
			'initValue': ingredient.supplier,
			'editable': true,
			'changed': false
		});
		
		setHead('Count');
		
		row.cells.push({
			'id': ingredient._id,
			'key': 'Count',
			'name': 'count',
			'value': ingredient.count,
			'component': defaultComponent,
			'initValue': ingredient.count,
			'editable': true,
			'changed': false
		});

		for(let key in ingredient.parameters) {
			const item = ingredient.parameters[key];
			setHead(key);
			row.cells.push({
				'id': ingredient._id,
				'key': key,
				'name': `parameters.${key}`,
				'value': item,
				'component': defaultComponent,
				'initValue': item,
				'editable': true,
				'changed': false
			});
		}

		setHead('Prime cost');

		row.cells.push({
			'id': ingredient._id,
			'key': 'Prime cost',
			'name': 'primecost',
			'value': ingredient.primecost,
			'component': defaultComponent,
			'initValue': ingredient.primecost,
			'editable': true,
			'changed': false
		});

		return row;
	}

	_onInputNew(ingredient) {
		const model = new IngredientModel(ingredient);
		model.count = 1;
		this._ingredients.push(model);
		this._product.ingredients.push({ id: model._id, count: 1});
		const parsedTable = this._parseTable(this._ingredients).table;

		const updateObj = {};
		updateObj[this._product._id] = this._product;

		return this.props.productApi
			.update(updateObj)
			.then((data) => {
				this.setState({ table: {body: parsedTable.body} });
				return data;
			});
	}

	_delete(id) {
		const index = this._product.ingredients.findIndex((ingredient) => ingredient.id === id);
		this._product.ingredients.splice(index, 1);

		const updateObj = {};
		updateObj[this._product._id] = this._product;

		return this.props.productApi.update(updateObj);
	}

	_onSave(changes) {
		for(let key in changes) {
			const ingredient = this._allIngredients.find((ingredient) => ingredient._id === key);
			changes[key]['group'] = ingredient.group;

			const { count } = changes[key];

			this._product.ingredients.forEach((ingredient) => {
				if (ingredient.id === key) {
					ingredient.count = count;
				}
			});

			delete changes[key]['count'];
		}
		
		const updateObj = {};
		updateObj[this._product._id] = this._product;

		return Promise
			.all([
				this.props.ingredientApi.update(changes),
				this.props.productApi.update(updateObj)
			])
			.then((data) => data[0]);
	}
}

export default Product;
