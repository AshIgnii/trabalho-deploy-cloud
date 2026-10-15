package br.unesc.notas.note;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record NoteRequest(
        @NotNull @Size(max = 200) String title,
        @NotNull @Size(max = 20000) String content,
        @NotNull @Pattern(regexp = "default|yellow|orange|red|pink|purple|blue|teal|green") String color,
        boolean pinned
) {
}
