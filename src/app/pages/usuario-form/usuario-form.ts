import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
// CORRECCIÓN: se quitaron `Validator` (no se usaba) y el import de `email` desde
// '@angular/forms/signals' (era de otra API, no se usaba y podía confundirse con
// el campo `email` del formulario).
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { UsuarioService } from '../../services/usuario';
import { NuevoUsuario, Usuario } from '../../models/usuario';

@Component({
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  selector: 'app-usuario-form',
  styleUrl: './usuario-form.scss',
  templateUrl: './usuario-form.html',
})
export class UsuarioForm implements OnInit {
  private fb = inject(FormBuilder);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Si la ruta trae :id estamos editando; si no, creando.
  usuarioId = this.route.snapshot.paramMap.get('id');
  fechaCreacion = '';
  cargando = signal(!!this.usuarioId);

  // CORRECCIÓN: renombrado de `rol` a `roles` (es una lista; `rol` chocaba con el control del formulario).
  roles: Usuario['rol'][] = ['Administrador', 'Soporte', 'Usuario'];

  // CORRECCIÓN: se quitó `bloqueado`; esa regla era de los tickets cerrados y
  // no existe para usuarios, así que no se usaba.
  guardando = signal(false);
  error = signal(false);

  // CORRECCIÓN: nonNullable para que los valores no puedan ser null y encajen con NuevoUsuario.
  usuarioForm = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    rol: ['Usuario' as Usuario['rol'], Validators.required],
  });

  ngOnInit(): void {
    if (!this.usuarioId) {
      return;
    }

    // CORRECCIÓN: antes llamaba obtenerUsuarios(id), que no existe con parámetro y
    // devuelve una lista. Ahora usa obtenerUsuario(id), que devuelve un solo usuario.
    this.usuarioService.obtenerUsuario(this.usuarioId).subscribe({
      next: (usuario) => {
        // CORRECCIÓN: `usurio` -> `usuario`; y fechaCreacion es opcional en el modelo.
        const { id, fechaCreacion, ...datos } = usuario;
        this.fechaCreacion = fechaCreacion ?? '';
        this.usuarioForm.patchValue({ ...datos, nombre: datos.nombre.trim() });
        this.cargando.set(false);
      },
      // CORRECCIÓN: faltaba manejar el error; sin esto la pantalla se quedaba cargando.
      error: (err) => {
        console.error('Error al cargar el usuario: ', err);
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  // CORRECCIÓN: faltaba guardar(); el formulario no tenía forma de enviarse.
  guardar(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      return;
    }

    const usuario: NuevoUsuario = {
      ...this.usuarioForm.getRawValue(),
      fechaCreacion: this.fechaCreacion || new Date().toISOString().slice(0, 10),
    };

    this.guardando.set(true);
    this.error.set(false);

    const peticion = this.usuarioId
      ? this.usuarioService.actualizarUsuario(this.usuarioId, usuario)
      : this.usuarioService.crearUsuario(usuario);

    peticion.subscribe({
      next: () => this.router.navigate(['/usuarios']),
      error: (err) => {
        console.error('Error al guardar el usuario: ', err);
        this.error.set(true);
        this.guardando.set(false);
      },
    });
  }
}
