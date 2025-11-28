import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Modelo } from '../../interfaces/modelo/modelo.interface';
import { Modeloslist } from '../../data/modelos-list';

@Component({
  selector: 'app-novidades',
  templateUrl: './novidades.component.html',
  styleUrls: ['./novidades.component.scss']
})
export class NovidadesComponent implements OnInit {

  @Input({ required: true }) modelosList: Modelo[] = Modeloslist;
  cards: Modelo[] = [];

  constructor(private router: Router) {}

  redirectModeloPage(id: string) {
    this.router.navigate([`modelo/${id}`]);
  }

  ngOnInit() {
    this.cards = this.modelosList.slice(0, 5);
  }
}