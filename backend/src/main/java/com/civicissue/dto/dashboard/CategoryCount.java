package com.civicissue.dto.dashboard;

import com.civicissue.enums.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoryCount {

    private Category category;
    private long count;
}
